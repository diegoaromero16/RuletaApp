import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }


  get client() {
    return this.supabase;
  }

  //Auth
  async login(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async logout() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  //Campañas
  async getCampanas() {
    return this.supabase
      .from('campanas')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async createCampana(campana: any) {
    return this.supabase
      .from('campanas')
      .insert(campana);
  }

  async updateCampana(id: string, cambios: any) {
    return this.supabase
      .from('campanas')
      .update(cambios)
      .eq('id', id);
  }

  async deleteCampana(id: string) {
    return this.supabase
      .from('campanas')
      .delete()
      .eq('id', id);
  }

  // ─── PREMIOS ────────────────────────────

  async getPremiosByCampana(campanaId: string) {
    return this.supabase
      .from('premios')
      .select('*')
      .eq('campana_id', campanaId)
      .order('created_at', { ascending: true });
  }

  async createPremio(premio: any) {
    return this.supabase
      .from('premios')
      .insert(premio);
  }

  async updatePremio(id: string, cambios: any) {
    return this.supabase
      .from('premios')
      .update(cambios)
      .eq('id', id);
  }

  async agregarStock(premioId: string, cantidad: number) {
    return this.supabase.rpc('agregar_stock', {
      p_premio_id: premioId,
      p_cantidad: cantidad
    });
  }

  async deletePremio(id: string) {
    return this.supabase
      .from('premios')
      .delete()
      .eq('id', id);
  }

  // ─── SORTEOS ────────────────────────────

  async realizarSorteo(campanaId: string, dispositivoId: string) {
    return this.supabase.rpc('realizar_sorteo', {
      p_campana_id: campanaId,
      p_dispositivo_id: dispositivoId
    });
  }

  async getSorteosByCampana(campanaId: string) {
    return this.supabase
      .from('sorteos')
      .select(`
        *,
        premios (nombre, color)
      `)
      .eq('campana_id', campanaId)
      .order('fecha', { ascending: false });
  }

  suscribirSorteos(campanaId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('sorteos-' + campanaId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sorteos',
          filter: 'campana_id=eq.' + campanaId
        },
        callback
      )
      .subscribe();
  }

  // ─── REALTIME ───────────────────────────

  suscribirPremios(campanaId: string, callback: (payload: any) => void, sufijo: string = '') {
    return this.supabase
      .channel('premios-' + campanaId + sufijo)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'premios',
          filter: 'campana_id=eq.' + campanaId
        },
        callback
      )
      .subscribe();
  }
}
