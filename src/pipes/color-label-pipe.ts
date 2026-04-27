import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'colorLabel',
  standalone: true
})
export class ColorLabelPipe implements PipeTransform {

  transform(colores: any[], valor: string): string {
    const encontrado = colores.find(c => c.valor === valor);
    return encontrado ? encontrado.label : valor;
  }
}