import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-ruleta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ruleta.html',
  styleUrl: './ruleta.css'
})
export class Ruleta implements OnDestroy, AfterViewInit {

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  campanaId = '';
  campana: any = null;
  premios: any[] = [];
  cargando = true;
  girando = false;
  premioGanado: any = null;
  mostrarResultado = false;
  sinPremios = false;
  dispositivoId = '';
  realtimeChannel: any = null;

  private angulo = 0;

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngAfterViewInit() {
    this.campanaId = this.route.snapshot.paramMap.get('id') || '';
    this.dispositivoId = this.obtenerDispositivoId();
    await this.cargarDatos();
    this.suscribirRealtime();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
    }
  }

  obtenerDispositivoId(): string {
    let id = localStorage.getItem('dispositivo_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('dispositivo_id', id);
    }
    return id;
  }

  async cargarDatos() {
    try {
      this.cargando = true;

      const { data: campana } = await this.supabase.client
        .from('campanas')
        .select('*')
        .eq('id', this.campanaId)
        .eq('activa', true)
        .single();

      if (!campana) {
        this.cargando = false;
        this.cdr.detectChanges();
        return;
      }

      this.campana = campana;

      const { data: premios } = await this.supabase.client
        .from('premios')
        .select('*')
        .eq('campana_id', this.campanaId)
        .eq('activo', true)
        .gt('stock_actual', 0);

      this.premios = premios || [];
      this.sinPremios = this.premios.length === 0;

    } catch (e) {
      console.log('error:', e);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
      if (this.premios.length > 0) {
        setTimeout(() => {
          if (this.canvasRef?.nativeElement) {
            this.dibujarRuleta(0);
          }
        }, 300);
      }
    }
  }

  suscribirRealtime() {
    this.realtimeChannel = this.supabase.suscribirPremios(
      this.campanaId,
      async (payload: any) => {
        // Recarga los premios activos
        const { data } = await this.supabase.client
          .from('premios')
          .select('*')
          .eq('campana_id', this.campanaId)
          .eq('activo', true)
          .gt('stock_actual', 0);

        this.premios = data || [];
        this.sinPremios = this.premios.length === 0;
        this.cdr.detectChanges();

        // Redibuja la ruleta con los premios actualizados
        if (this.premios.length > 0) {
          setTimeout(() => this.dibujarRuleta(0), 100);
        }
      }
    );
  }

  dibujarRuleta(anguloActual: number) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 4;
    const n = this.premios.length;
    const arco = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.premios.forEach((premio, i) => {
      const inicio = anguloActual + i * arco;
      const fin = inicio + arco;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, inicio, fin);
      ctx.closePath();
      ctx.fillStyle = premio.color || '#1B4F8A';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(inicio + arco / 2);

      // Centro real del segmento entre el circulo central (36px) y el borde
      const distanciaTexto = 36 + (r - 36) / 2;

      ctx.font = '500 20px Arial';
      ctx.fillStyle = premio.color === '#FFFFFF' ? '#1B4F8A' : '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      // Dividir el texto en palabras y armar líneas
      const palabras = premio.nombre.split(' ');
      const lineas: string[] = [];
      let lineaActual = '';
      const maxCaracteres = 10;

      palabras.forEach((palabra: string) => {
        if ((lineaActual + ' ' + palabra).trim().length <= maxCaracteres) {
          lineaActual = (lineaActual + ' ' + palabra).trim();
        } else {
          if (lineaActual) lineas.push(lineaActual);
          lineaActual = palabra;
        }
      });
      if (lineaActual) lineas.push(lineaActual);

      // Dibujar cada línea centrada
      const alturaLinea = 16;
      const offsetInicial = -((lineas.length - 1) * alturaLinea) / 2;

      lineas.forEach((linea, idx) => {
        ctx.fillText(linea, distanciaTexto, offsetInicial + idx * alturaLinea);
      });

      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#1B4F8A';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  async girar() {
    if (this.girando || this.premios.length === 0) return;

    this.girando = true;
    this.mostrarResultado = false;
    this.premioGanado = null;
    this.cdr.detectChanges();

    const { data: resultado, error } = await this.supabase.realizarSorteo(
      this.campanaId,
      this.dispositivoId
    );

    if (error || !resultado || resultado.error) {
      this.sinPremios = true;
      this.girando = false;
      this.cdr.detectChanges();
      return;
    }

    // Buscá el premio ganador en la lista actual por ID
    const premioIndex = this.premios.findIndex(p => p.id === resultado.premio_id);

    if (premioIndex === -1) {
      this.sinPremios = true;
      this.girando = false;
      this.cdr.detectChanges();
      return;
    }

    const n = this.premios.length;
    const arco = (2 * Math.PI) / n;

    // Calculá cuánto tiene que girar para que el puntero apunte al premio ganador
    const anguloSegmento = premioIndex * arco + arco / 2;
    const anguloObjetivo = 2 * Math.PI - anguloSegmento - (Math.PI / 2);
    const vueltas = 2 * Math.PI * 8;
    const anguloDestino = vueltas + anguloObjetivo;

    const duracion = 5000;
    const inicio = performance.now();
    const anguloInicio = this.angulo % (2 * Math.PI);

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animar = (ahora: number) => {
      const transcurrido = ahora - inicio;
      const progreso = Math.min(transcurrido / duracion, 1);
      this.angulo = anguloInicio + anguloDestino * easeOut(progreso);
      this.dibujarRuleta(this.angulo);

      if (progreso < 1) {
        requestAnimationFrame(animar);
      } else {
        // Usá directamente el resultado de Supabase para mostrar el premio
        this.premioGanado = {
          nombre: resultado.nombre,
          descripcion: resultado.descripcion,
          color: resultado.color,
          imagen_url: resultado.imagen_url
        };
        this.mostrarResultado = true;
        this.girando = false;
        this.cdr.detectChanges();

        // Recargá los premios activos
        this.supabase.client
          .from('premios')
          .select('*')
          .eq('campana_id', this.campanaId)
          .eq('activo', true)
          .gt('stock_actual', 0)
          .then(({ data }) => {
            this.premios = data || [];
            this.sinPremios = this.premios.length === 0;
            this.cdr.detectChanges();
            if (this.premios.length > 0) {
              this.dibujarRuleta(this.angulo % (2 * Math.PI));
            }
          });
      }
    };

    requestAnimationFrame(animar);
  }

  cerrarResultado() {
    this.mostrarResultado = false;
    this.premioGanado = null;
    this.cdr.detectChanges();
  }
}