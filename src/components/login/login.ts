import { Component } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  cargando = false;
  error = '';

  constructor(private supabase: SupabaseService, private router: Router) { }


  async login() {
    this.cargando = true;
    this.error = '';

    const { data, error } = await this.supabase.login(this.email, this.password);


    if (error) {
      this.error = 'Email o contraseña incorrectos';
      this.cargando = false;
      return;
    }
    this.router.navigate(['/admin']);
  }
}
