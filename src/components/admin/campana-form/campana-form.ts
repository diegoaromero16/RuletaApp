import { Component, Output, EventEmitter, ChangeDetectorRef, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-campana-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campana-form.html',
  styleUrl: './campana-form.css'
})
export class CampanaFormComponent implements OnInit, OnChanges {

  @Output() guardado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Input() campana: any = null;

  get esEdicion() {
    return !!this.campana?.id;
  }

  form = {
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    activa: true
  };

  guardando = false;
  error = '';

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['campana']) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    if (this.campana) {
      this.form = {
        nombre: this.campana.nombre || '',
        descripcion: this.campana.descripcion || '',
        fecha_inicio: this.campana.fecha_inicio || '',
        fecha_fin: this.campana.fecha_fin || '',
        activa: this.campana.activa ?? true
      };
    } else {
      this.form = {
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        activa: true
      };
    }
    this.cdr.detectChanges();
  }

  async guardar() {
    if (!this.form.nombre) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    try {
      this.guardando = true;
      this.error = '';

      if (this.esEdicion) {
        const { error } = await this.supabase.updateCampana(
          this.campana.id,
          this.form
        );
        if (error) {
          this.error = 'Error al actualizar la campaña';
          return;
        }
      } else {
        const { error } = await this.supabase.createCampana(this.form);
        if (error) {
          this.error = 'Error al guardar la campaña';
          return;
        }
      }

      this.guardado.emit();

    } catch (e) {
      this.error = 'Error inesperado';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }
}