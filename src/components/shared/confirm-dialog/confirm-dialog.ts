import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {

  @Input() visible = false;
  @Input() titulo = '¿Estás seguro?';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Eliminar';
  @Input() textoCancelar = 'Cancelar';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}