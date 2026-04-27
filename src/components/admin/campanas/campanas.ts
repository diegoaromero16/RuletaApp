import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { CampanaDetalle } from '../campana-detalle/campana-detalle';
import { CampanaFormComponent } from '../campana-form/campana-form';
import { ModalComponent } from '../../shared/modal/modal';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-campanas',
  standalone: true,
  imports: [CommonModule, CampanaDetalle, CampanaFormComponent, ModalComponent, ConfirmDialogComponent],
  templateUrl: './campanas.html',
  styleUrl: './campanas.css',
})
export class Campanas implements OnInit {

  campanas: any[] = [];
  cargando = true;
  campanaSeleccionada: any = null;
  mostrarFormulario = false;
  campanaAEditar: any = null;
  mostrarConfirm = false;
  campanaAEliminar: any = null;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.cargarCampanas();
  }

  async cargarCampanas() {
    try {
      this.cargando = true;
      this.cdr.detectChanges();
      const { data } = await this.supabase.getCampanas();
      if (data) this.campanas = data;
    } catch (e) {
      console.log('error:', e);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  get campanasActivas() {
    return this.campanas.filter(c => c.activa).length;
  }

  seleccionarCampana(campana: any) {
    this.campanaSeleccionada = campana;
    this.cdr.detectChanges();
  }

  volver() {
    this.campanaSeleccionada = null;
    this.cdr.detectChanges();
  }

  abrirFormulario() {
    this.campanaAEditar = null;
    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  abrirEditarCampana(campana: any) {
    this.campanaAEditar = { ...campana };
    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  async onCampanaGuardada() {
    this.mostrarFormulario = false;
    this.campanaAEditar = null;
    await this.ngOnInit();
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.campanaAEditar = null;
    this.cdr.detectChanges();
  }

  confirmarEliminar(campana: any) {
    this.campanaAEliminar = campana;
    this.mostrarConfirm = true;
    this.cdr.detectChanges();
  }

  cancelarEliminar() {
    this.campanaAEliminar = null;
    this.mostrarConfirm = false;
    this.cdr.detectChanges();
  }

  async ejecutarEliminar() {
    if (!this.campanaAEliminar) return;

    const { error } = await this.supabase.deleteCampana(this.campanaAEliminar.id);

    if (error) {
      alert('Error al eliminar la campaña');
      return;
    }

    // Elimina del array local sin recargar
    this.campanas = this.campanas.filter(c => c.id !== this.campanaAEliminar.id);
    this.campanaAEliminar = null;
    this.mostrarConfirm = false;
    this.cdr.detectChanges();
  }
}
