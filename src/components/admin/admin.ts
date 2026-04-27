import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Campanas } from '../admin/campanas/campanas';
import { ReportesGlobalComponent } from './reportes-global/reportes-global';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, Campanas,
    ReportesGlobalComponent
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {

  seccionActiva: 'campanas' | 'reportes' = 'campanas';
  menuAbierto = false;

  constructor(private supabase: SupabaseService, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {

  }

  cambiarSeccion(seccion: 'campanas' | 'reportes') {
    this.seccionActiva = seccion;
    this.menuAbierto = false;
    this.cdr.detectChanges();
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
    this.cdr.detectChanges();
  }

  async logout() {
    await this.supabase.logout();
    this.router.navigate(['/login']);
  }

}
