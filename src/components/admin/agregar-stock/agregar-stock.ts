import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-agregar-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-stock.html',
  styleUrl: './agregar-stock.css'
})
export class AgregarStockComponent {

  @Input() premio: any;
  @Output() guardado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  cantidad = 1;
  guardando = false;
  error = '';

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  get stockNuevo() {
    return (this.premio?.stock_actual || 0) + (this.cantidad || 0);
  }

  async guardar() {
    if (!this.cantidad || this.cantidad <= 0) {
      this.error = 'La cantidad debe ser mayor a 0';
      return;
    }

    try {
      this.guardando = true;
      this.error = '';

      const { error } = await this.supabase.agregarStock(
        this.premio.id,
        this.cantidad
      );

      if (error) {
        this.error = 'Error al agregar stock';
        return;
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