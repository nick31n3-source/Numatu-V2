
import { CollectionData, User } from './types';
import { MOCK_COLLECTIONS } from './constants';

const COLLECTIONS_KEY = 'numatu_collections_v5';
const USERS_KEY = 'numatu_users_v5';
const SESSION_KEY = 'numatu_active_session_v5';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const DatabaseService = {
  async _verifyWrite(key: string, expectedData: any): Promise<boolean> {
    try {
      const actual = localStorage.getItem(key);
      if (!actual) return false;
      const parsed = JSON.parse(actual);
      return JSON.stringify(parsed) === JSON.stringify(expectedData);
    } catch (e) {
      console.error("[DATABASE ERROR] Falha na persistência local:", e);
      return false;
    }
  },

  async getSession(): Promise<User | null> {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
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
      if (!saved) {
        // Agora inicia sempre vazio para não mostrar anúncios fakes
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  },

  async saveCollection(collection: CollectionData): Promise<void> {
    const collections = await this.getCollections();
    const index = collections.findIndex(c => c.id === collection.id);
    const updated = index > -1 
      ? collections.map(c => c.id === collection.id ? collection : c)
      : [collection, ...collections];
    
    await delay(100);
    
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    const ok = await this._verifyWrite(COLLECTIONS_KEY, updated);
    
    if (ok) {
      window.dispatchEvent(new CustomEvent('numatu_data_change', { 
        detail: { type: 'COLLECTION', data: collection } 
      }));
    } else {
      throw new Error("Erro de escrita no banco local.");
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const saved = localStorage.getItem(USERS_KEY);
      const defaultUsers: User[] = [{ 
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
      }];
      return saved ? JSON.parse(saved) : defaultUsers;
    } catch {
      return [];
    }
  },

  async saveUser(user: User): Promise<void> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    const updated = index > -1 ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    await this._verifyWrite(USERS_KEY, updated);
    
    const session = await this.getSession();
    if (session && session.id === user.id) {
      await this.setSession(user);
    }
  },

  async clearDatabase(): Promise<void> {
    localStorage.clear();
    window.location.reload();
  }
};
