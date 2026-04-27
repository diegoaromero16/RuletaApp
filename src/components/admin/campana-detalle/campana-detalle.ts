import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, input, OnDestroy, OnInit, Output, output } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { PremioFormComponent } from '../premio-form/premio-form';
import { ModalComponent } from '../../shared/modal/modal';
import { AgregarStockComponent } from '../agregar-stock/agregar-stock';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { ReportesCampanaComponent } from '../reportes-campana/reportes-campana';


@Component({
  selector: 'app-campana-detalle',
  standalone: true,
  imports: [CommonModule, PremioFormComponent, ModalComponent,
    AgregarStockComponent, ConfirmDialogComponent, ReportesCampanaComponent
  ],
  templateUrl: './campana-detalle.html',
  styleUrl: './campana-detalle.css',
})
export class CampanaDetalle implements OnInit, OnDestroy {

  @Input() campana: any;
  @Output() volver = new EventEmitter<void>();

  tabActiva: 'premios' | 'reportes' | 'link' = 'premios';
  premios: any[] = [];
  sorteos: any[] = [];
  cargando = true;
  mostrarFormPremio = false;
  mostrarAgregarStock = false;
  mostrarConfirm = false;
  premioSeleccionado: any = null;
  premioAEditar: any = null;
  premioAEliminar: any = null;
  realtimeChannel: any = null;

  colorSiguiente = '#1B4F8A';


  constructor(private supabase: SupabaseService, private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    await this.cargarPremios();
    this.suscribirRealtime();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
    }
  }

  suscribirRealtime() {
    this.realtimeChannel = this.supabase.suscribirPremios(
      this.campana.id,
      async () => {
        await this.cargarPremios();
      },
      '-detalle'  // ← sufijo único
    );
  }

  async cargarPremios() {
    try {
      this.cargando = true;
      const { data, error } = await this.supabase.getPremiosByCampana(this.campana.id);

      if (data) {
        this.premios = data;
      }
    } catch (e) {
      console.log('error', e);
    }
    finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async cargarSorteos() {
    try {
      const { data } = await this.supabase.getSorteosByCampana(this.campana.id);
      if (data) {
        this.sorteos = data;
      }
    } catch (e) {
      console.log('error', e);
    }
    finally {
      this.cdr.detectChanges();
    }
  }

  async cambiarTab(tab: 'premios' | 'reportes' | 'link') {
    this.tabActiva = tab;
    if (tab === 'reportes' && this.sorteos.length === 0) {
      await this.cargarSorteos();
    }
    this.cdr.detectChanges();
  }

  get stockTotal() {
    return this.premios.reduce((acc, p) => acc + p.stock_actual, 0);
  }

  get linkRuleta() {
    return `${window.location.origin}/ruleta/${this.campana.id}`;
  }

  copiarLink() {
    navigator.clipboard.writeText(this.linkRuleta);
    alert('Link copiado al portapapeles');
  }

  porcentajeStock(premio: any): number {
    if (premio.stock_inicial === 0) return 0;
    return Math.round((premio.stock_actual / premio.stock_inicial) * 100);
  }

  colorBarra(premio: any): string {
    const pct = this.porcentajeStock(premio);
    if (pct === 0) return '#e53935';
    if (pct <= 20) return '#F5A800';
    return '#1B4F8A';
  }

  volverAtras() {
    this.volver.emit();
  }

  abrirFormPremio() {
    this.premioAEditar = null;
    this.colorSiguiente = this.getSiguienteColor();
    this.mostrarFormPremio = true;
    this.cdr.detectChanges();
  }

  cerrarFormPremio() {
    this.mostrarFormPremio = false;
    this.cdr.detectChanges();
  }

  abrirEditarPremio(premio: any) {
    this.premioAEditar = { ...premio };
    this.mostrarFormPremio = true;
    this.cdr.detectChanges();
  }

  async onPremioGuardado() {
    this.mostrarFormPremio = false;
    this.premioAEditar = null;
    await this.cargarPremios();
  }

  abrirAgregarStock(premio: any) {
    this.premioSeleccionado = premio;
    this.mostrarAgregarStock = true;
    this.cdr.detectChanges();
  }

  cerrarAgregarStock() {
    this.mostrarAgregarStock = false;
    this.premioSeleccionado = null;
    this.cdr.detectChanges();
  }

  async onStockAgregado() {
    this.mostrarAgregarStock = false;
    this.premioSeleccionado = null;
    await this.cargarPremios();
  }

  confirmarEliminarPremio(premio: any) {
    this.premioAEliminar = premio;
    this.mostrarConfirm = true;
    this.cdr.detectChanges();
  }

  cancelarEliminar() {
    this.premioAEliminar = null;
    this.mostrarConfirm = false;
    this.cdr.detectChanges();
  }

  async ejecutarEliminarPremio() {
    if (!this.premioAEliminar) return;

    const { error } = await this.supabase.deletePremio(this.premioAEliminar.id);

    if (error) {
      alert('Error al eliminar el premio');
      return;
    }

    // Elimina del array local sin recargar
    this.premios = this.premios.filter(p => p.id !== this.premioAEliminar.id);
    this.premioAEliminar = null;
    this.mostrarConfirm = false;
    this.cdr.detectChanges();
  }

  getSiguienteColor(): string {
    const secuencia = ['#1B4F8A', '#C8960C', '#FFFFFF', '#C8960C'];
    return secuencia[this.premios.length % secuencia.length];
  }
}
