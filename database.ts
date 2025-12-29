
import { CollectionData, User } from './types';

const COLLECTIONS_KEY = 'numatu_collections_v5';
const USERS_KEY = 'numatu_users_v5';
const SESSION_KEY = 'numatu_active_session_v5';

export const DatabaseService = {
  async getSession(): Promise<User | null> {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return null;
      const sessionData = JSON.parse(saved);
      // Revalida se o usuário ainda existe no banco global
      const users = await this.getUsers();
      return users.find(u => u.id === sessionData.id) || null;
    } catch {
      return null;
    }
  },

  async setSession(user: User | null): Promise<void> {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  async getCollections(): Promise<CollectionData[]> {
    try {
      const saved = localStorage.getItem(COLLECTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async saveCollection(collection: CollectionData): Promise<void> {
    const collections = await this.getCollections();
    const { _abandoned, ...cleanData } = collection as any;
    
    const index = collections.findIndex(c => c.id === collection.id);
    let updated: CollectionData[];
    
    if (index > -1) {
      updated = collections.map(c => c.id === collection.id ? cleanData : c);
    } else {
      updated = [cleanData, ...collections];
    }
    
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    
    window.dispatchEvent(new CustomEvent('numatu_data_change', { 
      detail: { type: 'COLLECTION', data: collection } 
    }));
  },

  async getUsers(): Promise<User[]> {
    try {
      const saved = localStorage.getItem(USERS_KEY);
      const adminDefault: User = { 
        id: 'admin-01', 
        username: 'admin',
        email: 'admin@numatu.app', 
        password: '123', 
        role: 'ADMIN', 
        name: 'Admin NUMATU', 
        isProfileComplete: true, 
        email_verificado: true, 
        telefone_verificado: true,
        cpf_verificado: true,
        endereco_verificado: true,
        face_verified: true,
        isActive: true 
      };

      if (!saved) {
        localStorage.setItem(USERS_KEY, JSON.stringify([adminDefault]));
        return [adminDefault];
      }
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  async saveUser(user: User): Promise<void> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    let updated: User[];
    if (index > -1) {
      updated = users.map(u => u.id === user.id ? user : u);
    } else {
      updated = [...users, user];
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    
    // Atualiza a sessão se for o usuário logado
    const session = await this.getSession();
    if (session && session.id === user.id) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
  },

  async clearDatabase(): Promise<void> {
    // Agora o reset é seletivo se necessário, mas para o console mantemos total
    localStorage.clear();
    window.location.reload();
  }
};
