import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../services/supabase.service';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes-campana',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-campana.html',
  styleUrl: './reportes-campana.css'
})
export class ReportesCampanaComponent implements OnInit, OnDestroy {

  @Input() campana: any;
  @ViewChild('chartDias', { static: false }) chartDiasRef!: ElementRef;
  @ViewChild('chartPremios', { static: false }) chartPremiosRef!: ElementRef;

  cargando = true;
  sorteos: any[] = [];
  premios: any[] = [];
  chartDias: any = null;
  chartPremios: any = null;
  realtimeChannel: any = null;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.cargarDatos();
    this.suscribirRealtime();
  }


  ngOnDestroy() {
    if (this.chartDias) this.chartDias.destroy();
    if (this.chartPremios) this.chartPremios.destroy();
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
    }
  }

  suscribirRealtime() {
    this.realtimeChannel = this.supabase.suscribirPremios(
      this.campana.id,
      async () => {
        await this.cargarDatos();
      },
      '-reportes'  // ← sufijo único
    );
  }

  async cargarDatos() {
    try {
      this.cargando = true;

      const [{ data: sorteos }, { data: premios }] = await Promise.all([
        this.supabase.getSorteosByCampana(this.campana.id),
        this.supabase.getPremiosByCampana(this.campana.id)
      ]);

      this.sorteos = sorteos || [];
      this.premios = premios || [];

    } catch (e) {
      console.log('error:', e);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
      setTimeout(() => this.inicializarGraficos(), 300);
    }
  }

  // ─── MÉTRICAS ────────────────────────────────────────

  get totalSorteos() {
    return this.sorteos.length;
  }

  get sorteosHoy() {
    const hoy = new Date().toDateString();
    return this.sorteos.filter(s =>
      new Date(s.fecha).toDateString() === hoy
    ).length;
  }

  get stockRestante() {
    return this.premios.reduce((acc, p) => acc + p.stock_actual, 0);
  }

  get premiosAgotados() {
    return this.premios.filter(p => p.stock_actual === 0).length;
  }

  get premioMasEntregado() {
    if (this.sorteosPorPremio.length === 0) return '-';
    return this.sorteosPorPremio[0].nombre;
  }

  // ─── SORTEOS POR DÍA ─────────────────────────────────

  get sorteosPorDia() {
    const mapa: { [key: string]: number } = {};
    this.sorteos.forEach(s => {
      const fecha = new Date(s.fecha).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short'
      });
      mapa[fecha] = (mapa[fecha] || 0) + 1;
    });

    const ultimos7 = Object.entries(mapa)
      .slice(-7)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }));

    return ultimos7;
  }

  // ─── SORTEOS POR PREMIO ───────────────────────────────

  get sorteosPorPremio() {
    const mapa: { [key: string]: any } = {};

    this.sorteos.forEach(s => {
      const id = s.premio_id;
      const nombre = s.premios?.nombre || 'Sin nombre';
      if (!mapa[id]) {
        mapa[id] = { id, nombre, cantidad: 0 };
      }
      mapa[id].cantidad++;
    });

    return Object.values(mapa)
      .sort((a: any, b: any) => b.cantidad - a.cantidad);
  }

  // ─── GRÁFICOS ─────────────────────────────────────────

  inicializarGraficos() {
    this.inicializarChartDias();
    this.inicializarChartPremios();
  }

  inicializarChartDias() {
    if (!this.chartDiasRef?.nativeElement) return;
    if (this.chartDias) this.chartDias.destroy();

    const datos = this.sorteosPorDia;

    this.chartDias = new Chart(this.chartDiasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.fecha),
        datasets: [{
          label: 'Sorteos',
          data: datos.map(d => d.cantidad),
          backgroundColor: '#1B4F8A',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }

  inicializarChartPremios() {
    if (!this.chartPremiosRef?.nativeElement) return;
    if (this.chartPremios) this.chartPremios.destroy();

    const datos = this.sorteosPorPremio;
    const colores = [
      '#1B4F8A',
      '#C8960C',
      '#FFFFFF',
      '#1B4F8A',
      '#C8960C',
      '#FFFFFF',
      '#1B4F8A',
      '#C8960C',
    ];

    this.chartPremios = new Chart(this.chartPremiosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: datos.map((d: any) => d.nombre),
        datasets: [{
          data: datos.map((d: any) => d.cantidad),
          backgroundColor: colores.slice(0, datos.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '65%'
      }
    });
  }

  // ─── EXPORTAR EXCEL ───────────────────────────────────

  exportarExcel() {
    const wb = XLSX.utils.book_new();

    const resumen = [
      ['Campaña', this.campana.nombre],
      ['Total sorteos', this.totalSorteos],
      ['Sorteos hoy', this.sorteosHoy],
      ['Stock restante', this.stockRestante],
      ['Premios agotados', this.premiosAgotados],
      ['Premio más entregado', this.premioMasEntregado],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    const porPremio = [
      ['Premio', 'Sorteos', '% del total'],
      ...this.sorteosPorPremio.map((p: any) => [
        p.nombre,
        p.cantidad,
        this.totalSorteos > 0
          ? Math.round((p.cantidad / this.totalSorteos) * 100) + '%'
          : '0%'
      ])
    ];
    const wsPremios = XLSX.utils.aoa_to_sheet(porPremio);
    XLSX.utils.book_append_sheet(wb, wsPremios, 'Por Premio');

    const historial = [
      ['Premio', 'Fecha', 'Hora'],
      ...this.sorteos.map(s => [
        s.premios?.nombre || '-',
        new Date(s.fecha).toLocaleDateString('es-AR'),
        new Date(s.fecha).toLocaleTimeString('es-AR')
      ])
    ];
    const wsHistorial = XLSX.utils.aoa_to_sheet(historial);
    XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial');

    XLSX.writeFile(wb, `reporte-${this.campana.nombre}.xlsx`);
  }

  // ─── EXPORTAR PDF ─────────────────────────────────────

  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(27, 79, 138);
    doc.text('Mutual 3 de Abril — Reporte de Campaña', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(this.campana.nombre, 14, 30);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 38);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total sorteos: ${this.totalSorteos}`, 14, 52);
    doc.text(`Sorteos hoy: ${this.sorteosHoy}`, 14, 60);
    doc.text(`Stock restante: ${this.stockRestante}`, 14, 68);
    doc.text(`Premio más entregado: ${this.premioMasEntregado}`, 14, 76);

    autoTable(doc, {
      startY: 90,
      head: [['Premio', 'Sorteos', '% del total']],
      body: this.sorteosPorPremio.map((p: any) => [
        p.nombre,
        p.cantidad,
        this.totalSorteos > 0
          ? Math.round((p.cantidad / this.totalSorteos) * 100) + '%'
          : '0%'
      ]),
      headStyles: { fillColor: [27, 79, 138] },
      alternateRowStyles: { fillColor: [240, 244, 248] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: finalY,
      head: [['Premio', 'Fecha', 'Hora']],
      body: this.sorteos.slice(0, 50).map(s => [
        s.premios?.nombre || '-',
        new Date(s.fecha).toLocaleDateString('es-AR'),
        new Date(s.fecha).toLocaleTimeString('es-AR')
      ]),
      headStyles: { fillColor: [27, 79, 138] },
      alternateRowStyles: { fillColor: [240, 244, 248] }
    });

    doc.save(`reporte-${this.campana.nombre}.pdf`);
  }

  // ─── HELPERS COLORES ─────────────────────────────────────

  colores = ['#1B4F8A', '#3A7FC1', '#F5A800', '#2E7D32', '#C62828', '#6A1B9A', '#E65100', '#00695C'];

  get today() {
    return new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  getColor(index: number): string {
    return this.colores[index % this.colores.length];
  }

  getPremioColor(premioId: string): string {
    const premio = this.premios.find(p => p.id === premioId);
    return premio?.color || '#1B4F8A';
  }

  getPremioStock(premioId: string): number {
    const premio = this.premios.find(p => p.id === premioId);
    return premio?.stock_actual ?? 0;
  }

  porcentaje(premio: any): number {
    if (premio.stock_inicial === 0) return 0;
    return Math.round((premio.stock_actual / premio.stock_inicial) * 100);
  }

  colorStock(premio: any): string {
    const pct = this.porcentaje(premio);
    if (pct === 0) return '#C62828';
    if (pct <= 20) return '#F5A800';
    return '#1B4F8A';
  }
}