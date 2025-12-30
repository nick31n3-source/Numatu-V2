
import { createClient } from '@supabase/supabase-js';
import { CollectionData, User } from './types';

const SUPABASE_URL: string = 'https://escsfwcorqlbfyklkxlz.supabase.co'; 
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3Nmd2NvcnFsYmZ5a2xreGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzgyODUsImV4cCI6MjA4MjYxNDI4NX0.uPRyuBbdypXWg1tyAe0PChLY_vnKi2-5ExWXS8qHbes'; 

const isCloudEnabled = SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.startsWith('eyJ');
const supabase = isCloudEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }) : null;

const COLLECTIONS_KEY = 'numatu_collections_v5';
const USERS_KEY = 'numatu_users_v5';
const SESSION_KEY = 'numatu_active_session_v5';

export const DatabaseService = {
  isCloud: isCloudEnabled,

  async getSession(): Promise<User | null> {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return null;
      const sessionData = JSON.parse(saved);
      const users = await DatabaseService.getUsers();
      return users.find(u => u.id === sessionData.id) || null;
    } catch { return null; }
  },

  async setSession(user: User | null): Promise<void> {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  },

  async getUsers(): Promise<User[]> {
    if (supabase) {
      const { data } = await supabase.from('users').select('*');
      if (data) return data as User[];
    }
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveUser(user: User): Promise<void> {
    // 1. Salva no Supabase
    if (supabase) {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        face_verified: user.face_verified,
        cnpj_verificado: user.cnpj_verificado,
        isActive: user.isActive,
        foto_perfil_url: user.foto_perfil_url
      });
      if (error) console.error("Erro Supabase User:", error);
    }

    // 2. Backup Local
    const users = await DatabaseService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated = index > -1 ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    
    const session = await DatabaseService.getSession();
    if (session && session.id === user.id) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  async getCollections(): Promise<CollectionData[]> {
    let rawData: CollectionData[] = [];
    if (supabase) {
      const { data } = await supabase.from('collections').select('*').order('ts_solicitada', { ascending: false });
      rawData = (data || []) as CollectionData[];
    } else {
      const saved = localStorage.getItem(COLLECTIONS_KEY);
      rawData = saved ? JSON.parse(saved) : [];
    }

    const validUsers = await DatabaseService.getUsers();
    const validUserIds = new Set(validUsers.filter(u => u.isActive && (u.face_verified || u.cnpj_verificado || u.role === 'ADMIN')).map(u => u.id));

    // FILTRO RIGOROSO: Apenas anúncios de usuários ativos e verificados na tabela 'users'
    return rawData.filter(c => 
      validUserIds.has(c.id_anunciante) && 
      !c.id.includes('TEST') && 
      c.status !== 'CANCELADA'
    );
  },

  async saveCollection(collection: CollectionData): Promise<void> {
    const { _abandoned, ...cleanData } = collection as any;
    if (supabase) try { await supabase.from('collections').upsert(cleanData); } catch {}
    
    const collections = await DatabaseService.getCollections();
    const index = collections.findIndex(c => c.id === collection.id);
    let updated = index > -1 ? collections.map(c => c.id === collection.id ? cleanData : c) : [cleanData, ...collections];
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    
    window.dispatchEvent(new CustomEvent('numatu_data_change', { detail: { data: cleanData } }));
  },

  subscribeToCollections(callback: () => void) {
    if (!supabase) return () => {};
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => callback()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};
