import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
@Component({
  selector: 'app-premio-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './premio-form.html',
  styleUrl: './premio-form.css'
})
export class PremioFormComponent implements OnInit, OnChanges {

  @Input() campanaId = '';
  @Input() premio: any = null;
  @Output() guardado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Input() colorAuto = '#1B4F8A';


  get esEdicion() {
    return !!this.premio;
  }
  form = {
    nombre: '',
    descripcion: '',
    stock_inicial: 0,
    stock_actual: 0,
    color: '#1B4F8A',
    activo: true
  };
  coloresDisponibles = [
    { label: 'Azul', valor: '#1B4F8A' },
    { label: 'Dorado', valor: '#C8960C' },
    { label: 'Blanco', valor: '#FFFFFF' },
  ];

  guardando = false;
  error = '';

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.premio) {
      this.form = {
        nombre: this.premio.nombre,
        descripcion: this.premio.descripcion || '',
        stock_inicial: this.premio.stock_inicial,
        stock_actual: this.premio.stock_actual,
        color: this.premio.color || '#1B4F8A',
        activo: this.premio.activo
      };
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['premio'] || changes['colorAuto']) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    if (this.premio) {
      this.form = {
        nombre: this.premio.nombre || '',
        descripcion: this.premio.descripcion || '',
        stock_inicial: this.premio.stock_inicial || 0,
        stock_actual: this.premio.stock_actual || 0,
        color: this.premio.color || '#1B4F8A',
        activo: this.premio.activo ?? true
      };
    } else {
      this.form = {
        nombre: '',
        descripcion: '',
        stock_inicial: 0,
        stock_actual: 0,
        color: this.colorAuto || '#1B4F8A',
        activo: true
      };
    }
    this.cdr.detectChanges();
  }

  esColorPredefinido(): boolean {
    return this.coloresDisponibles.some(c => c.valor === this.form.color);
  }

  onStockChange() {
    this.form.stock_actual = this.form.stock_inicial;
  }

  async guardar() {
    if (!this.form.nombre) {
      this.error = 'El nombre es obligatorio';
      return;
    }
    if (this.form.stock_inicial <= 0) {
      this.error = 'El stock debe ser mayor a 0';
      return;
    }

    try {
      this.guardando = true;
      this.error = '';

      if (this.esEdicion) {
        const { error } = await this.supabase.updatePremio(this.premio.id, {
          nombre: this.form.nombre,
          descripcion: this.form.descripcion,
          color: this.form.color,
          activo: this.form.activo
        });
        if (error) {
          this.error = 'Error al actualizar el premio';
          console.log('error update:', error);
          return;
        }
      } else {
        const { error } = await this.supabase.createPremio({
          ...this.form,
          campana_id: this.campanaId
        });
        if (error) {
          this.error = 'Error al guardar el premio';
          console.log('error create:', error);
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