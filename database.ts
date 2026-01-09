
import { createClient } from '@supabase/supabase-js';
import { CollectionData, User } from './types';

const SUPABASE_URL: string = 'https://escsfwcorqlbfyklkxlz.supabase.co'; 
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3Nmd2NvcnFsYmZ5a2xreGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzgyODUsImV4cCI6MjA4MjYxNDI4NX0.uPRyuBbdypXWg1tyAe0PChLY_vnKi2-5ExWXS8qHbes'; 

const isCloudEnabled = SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.startsWith('eyJ');
const supabase = isCloudEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }) : null;

const COLLECTIONS_KEY = 'numatu_collections_v5';
const USERS_KEY = 'numatu_users_v5';
const SESSION_KEY = 'numatu_active_session_v5';

const mapUserFromDb = (dbUser: any): User => ({
  ...dbUser,
  isActive: dbUser.is_active,
  isProfileComplete: dbUser.is_profile_complete
});

const mapCollectionFromDb = (dbCol: any): CollectionData => ({
  ...dbCol,
  companyName: dbCol.company_name || 'Empresa Local',
  companyAvatar: dbCol.company_avatar || '',
  collectorName: dbCol.collector_name,
  isArchived: dbCol.is_archived
});

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
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) return data.map(mapUserFromDb);
      if (error) console.error("DEBUG [DB]: Erro GetUsers:", error.message);
    }
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveUser(user: User): Promise<void> {
    console.log("DEBUG [DB]: Salvando usuário:", user.id);
    if (supabase) {
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        is_active: user.isActive,
        is_profile_complete: user.isProfileComplete,
        face_verified: user.face_verified,
        email_verificado: user.email_verificado,
        telefone_verificado: user.telefone_verificado,
        cpf_verificado: user.cpf_verificado,
        cnpj_verificado: user.cnpj_verificado,
        endereco_verificado: user.endereco_verificado,
        foto_perfil_url: user.foto_perfil_url,
        tipo_empresa: user.tipo_empresa,
        bio: user.bio,
        cnpj: user.cnpj,
        cpf: user.cpf,
        telefone: user.telefone,
        cep: user.cep,
        rua: user.rua,
        numero: user.numero,
        bairro: user.bairro,
        cidade: user.cidade
      };

      const { error } = await supabase.from('users').upsert(payload);
      if (error) console.error("DEBUG [DB]: Erro SaveUser:", error.message);
    }

    const users = await DatabaseService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated = index > -1 ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.id === user.id) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
  },

  async getCollections(): Promise<CollectionData[]> {
    let rawData: CollectionData[] = [];
    if (supabase) {
      const { data, error } = await supabase.from('collections').select('*').order('ts_solicitada', { ascending: false });
      if (error) console.error("DEBUG [DB]: Erro GetCollections:", error.message);
      if (data) rawData = data.map(mapCollectionFromDb);
    }
    
    const saved = localStorage.getItem(COLLECTIONS_KEY);
    const localData: CollectionData[] = saved ? JSON.parse(saved) : [];
    
    const combined = [...rawData];
    const remoteIds = new Set(rawData.map(r => r.id));
    localData.forEach(l => {
        if (!remoteIds.has(l.id)) combined.push(l);
    });

    console.log("DEBUG [DB]: Listando coletas (total):", combined.length);
    
    return combined.filter(c => 
      !c.id.includes('TEST') && 
      c.status !== 'CANCELADA'
    ).sort((a, b) => new Date(b.ts_solicitada).getTime() - new Date(a.ts_solicitada).getTime());
  },

  async saveCollection(collection: CollectionData): Promise<void> {
    console.log("DEBUG [DB]: Iniciando salvamento de coleta:", collection.id);
    const { _abandoned, ...cleanData } = collection as any;
    
    if (supabase) {
      const payload = {
        ...cleanData,
        // CRITICAL FIX: Strings vazias em chaves estrangeiras devem ser NULL
        id_coletor: cleanData.id_coletor || null,
        id_anunciante: cleanData.id_anunciante || null,
        company_name: cleanData.companyName || 'Empresa',
        company_avatar: cleanData.companyAvatar || '',
        collector_name: cleanData.collectorName || null,
        is_archived: cleanData.isArchived || false
      };
      
      delete (payload as any).companyName;
      delete (payload as any).companyAvatar;
      delete (payload as any).collectorName;
      delete (payload as any).isArchived;

      const { error } = await supabase.from('collections').upsert(payload);
      if (error) console.error("DEBUG [DB]: Erro SaveCollection (Supabase):", error.message);
      else console.log("DEBUG [DB]: Coleta salva com sucesso no Supabase.");
    }
    
    const collections = await DatabaseService.getCollections();
    const index = collections.findIndex(c => c.id === collection.id);
    let updated = index > -1 ? collections.map(c => c.id === collection.id ? cleanData : c) : [cleanData, ...collections];
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    console.log("DEBUG [DB]: Coleta salva no LocalStorage.");
    
    window.dispatchEvent(new CustomEvent('numatu_data_change', { detail: { data: cleanData } }));
  },

  async clearAllData(): Promise<void> {
    localStorage.clear();
    window.location.reload();
  },

  subscribeToCollections(callback: () => void) {
    if (!supabase) return () => {};
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => callback()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};
