import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../services/supabase.service';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes-global',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-global.html',
  styleUrl: './reportes-global.css'
})
export class ReportesGlobalComponent implements OnInit, OnDestroy {

  @ViewChild('chartCampanas', { static: false }) chartCampanasRef!: ElementRef;
  @ViewChild('chartPremios', { static: false }) chartPremiosRef!: ElementRef;

  cargando = true;
  campanas: any[] = [];
  sorteos: any[] = [];
  premios: any[] = [];
  chartCampanas: any = null;
  chartPremios: any = null;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.cargarDatos();
  }

  ngOnDestroy() {
    if (this.chartCampanas) this.chartCampanas.destroy();
    if (this.chartPremios) this.chartPremios.destroy();
  }

  async cargarDatos() {
    try {
      this.cargando = true;

      const { data: campanas } = await this.supabase.getCampanas();
      this.campanas = campanas || [];

      const sorteosPorCampana = await Promise.all(
        this.campanas.map(c => this.supabase.getSorteosByCampana(c.id))
      );

      this.sorteos = sorteosPorCampana.flatMap(r => r.data || []);

      const premiosPorCampana = await Promise.all(
        this.campanas.map(c => this.supabase.getPremiosByCampana(c.id))
      );

      this.premios = premiosPorCampana.flatMap(r => r.data || []);

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

  get campanasActivas() {
    return this.campanas.filter(c => c.activa).length;
  }

  get stockTotal() {
    return this.premios.reduce((acc, p) => acc + p.stock_actual, 0);
  }

  get campanamasActiva() {
    if (this.campanas.length === 0) return '-';
    const conteo: { [key: string]: number } = {};
    this.sorteos.forEach(s => {
      conteo[s.campana_id] = (conteo[s.campana_id] || 0) + 1;
    });
    const maxId = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    return this.campanas.find(c => c.id === maxId)?.nombre || '-';
  }

  get premioMasEntregado() {
    const conteo: { [key: string]: any } = {};
    this.sorteos.forEach(s => {
      const nombre = s.premios?.nombre || 'Sin nombre';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  }

  // ─── DATOS POR CAMPAÑA ────────────────────────────────

  get datosPorCampana() {
    return this.campanas.map(c => ({
      nombre: c.nombre.length > 20 ? c.nombre.substring(0, 20) + '...' : c.nombre,
      sorteos: this.sorteos.filter(s => s.campana_id === c.id).length,
      activa: c.activa
    })).sort((a, b) => b.sorteos - a.sorteos);
  }

  // ─── DATOS POR PREMIO GLOBAL ─────────────────────────

  get datosPorPremio() {
    const conteo: { [key: string]: number } = {};
    this.sorteos.forEach(s => {
      const nombre = s.premios?.nombre || 'Sin nombre';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }

  // ─── GRÁFICOS ─────────────────────────────────────────

  inicializarGraficos() {
    this.inicializarChartCampanas();
    this.inicializarChartPremios();
  }

  inicializarChartCampanas() {
    if (!this.chartCampanasRef?.nativeElement) return;
    if (this.chartCampanas) this.chartCampanas.destroy();

    const datos = this.datosPorCampana;

    this.chartCampanas = new Chart(this.chartCampanasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.nombre),
        datasets: [{
          label: 'Sorteos',
          data: datos.map(d => d.sorteos),
          backgroundColor: datos.map(d => d.activa ? '#1B4F8A' : '#aaa'),
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

    const datos = this.datosPorPremio;
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
        labels: datos.map(d => d.nombre),
        datasets: [{
          data: datos.map(d => d.cantidad),
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

  colores = ['#1B4F8A', '#3A7FC1', '#F5A800', '#2E7D32', '#C62828', '#6A1B9A', '#E65100', '#00695C'];

  getColor(i: number) {
    return this.colores[i % this.colores.length];
  }

  // ─── EXPORTAR EXCEL ───────────────────────────────────

  exportarExcel() {
    const wb = XLSX.utils.book_new();

    const resumen = [
      ['Reporte Global — Mutual 3 de Abril'],
      ['Generado', new Date().toLocaleDateString('es-AR')],
      [],
      ['Total sorteos', this.totalSorteos],
      ['Sorteos hoy', this.sorteosHoy],
      ['Campañas activas', this.campanasActivas],
      ['Stock total restante', this.stockTotal],
      ['Campaña más activa', this.campanamasActiva],
      ['Premio más entregado', this.premioMasEntregado],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');

    const porCampana = [
      ['Campaña', 'Sorteos', 'Estado'],
      ...this.datosPorCampana.map(c => [c.nombre, c.sorteos, c.activa ? 'Activa' : 'Inactiva'])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(porCampana), 'Por Campaña');

    const porPremio = [
      ['Premio', 'Sorteos totales'],
      ...this.datosPorPremio.map(p => [p.nombre, p.cantidad])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(porPremio), 'Por Premio');

    XLSX.writeFile(wb, `reporte-global-mutual.xlsx`);
  }

  // ─── EXPORTAR PDF ─────────────────────────────────────

  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(27, 79, 138);
    doc.text('Mutual 3 de Abril — Reporte Global', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 30);

    doc.setTextColor(0);
    doc.text(`Total sorteos: ${this.totalSorteos}`, 14, 44);
    doc.text(`Sorteos hoy: ${this.sorteosHoy}`, 14, 52);
    doc.text(`Campañas activas: ${this.campanasActivas}`, 14, 60);
    doc.text(`Campaña más activa: ${this.campanamasActiva}`, 14, 68);
    doc.text(`Premio más entregado: ${this.premioMasEntregado}`, 14, 76);

    autoTable(doc, {
      startY: 90,
      head: [['Campaña', 'Sorteos', 'Estado']],
      body: this.datosPorCampana.map(c => [c.nombre, c.sorteos, c.activa ? 'Activa' : 'Inactiva']),
      headStyles: { fillColor: [27, 79, 138] },
      alternateRowStyles: { fillColor: [240, 244, 248] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: finalY,
      head: [['Premio', 'Sorteos totales']],
      body: this.datosPorPremio.map(p => [p.nombre, p.cantidad]),
      headStyles: { fillColor: [27, 79, 138] },
      alternateRowStyles: { fillColor: [240, 244, 248] }
    });

    doc.save('reporte-global-mutual.pdf');
  }
}