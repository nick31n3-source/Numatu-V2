
import React from 'react';
import { 
  LayoutDashboard, Activity, Users, Leaf, Database, BookOpen, 
  Scale, Menu, X, MapPin, Share2, Award, Megaphone, LogOut, Truck, Mail, ShieldCheck, RefreshCw, CloudOff, Cloud
} from 'lucide-react';
import { User } from '../types';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  dbStatus?: 'CONNECTED' | 'SYNCING' | 'ERROR';
  onRetry?: () => void;
}

const BrandLogo = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="relative w-10 h-10 flex-shrink-0">
      <div className="absolute inset-0 bg-brand-teal rounded-full"></div>
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-brand-green rounded-b-full overflow-hidden border-t border-brand-tealDark/20"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Leaf size={18} className="text-white fill-brand-green translate-y-[-2px]" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-lg tracking-tighter text-brand-tealDark italic leading-none">NUMATU</span>
      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-greenDark">Cloud Logistics V2</span>
    </div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout, dbStatus = 'CONNECTED', onRetry }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'overview', label: 'Painel de Impacto', icon: LayoutDashboard, roles: ['ADMIN'] },
    { id: 'advertiser', label: 'Meus Anúncios', icon: Megaphone, roles: ['ADMIN', 'ADVERTISER'] },
    { id: 'operational', label: 'Pulsação da Operação', icon: Activity, roles: ['ADMIN'] },
    { id: 'geo', label: user.role === 'COLLECTOR' ? 'Minhas Rotas' : 'Mapa de Atuação', icon: MapPin, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'reports', label: 'Relatórios Automáticos', icon: Mail, roles: ['ADMIN'] },
    { id: 'gamification', label: 'Reconhecimento', icon: Award, roles: ['ADMIN', 'ADVERTISER', 'COLLECTOR'] },
    { id: 'rules', label: 'Lógica e Métricas', icon: Scale, roles: ['ADMIN'] },
    { id: 'integration', label: 'Conexão de Dados', icon: Share2, roles: ['ADMIN'] },
    { id: 'datamodel', label: 'Estrutura Técnica', icon: Database, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-brand-teal text-white rounded-full shadow-2xl active:scale-95 transition-all"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-10">
            <BrandLogo />
          </div>
          
          <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider ${
                  activeTab === item.id 
                    ? 'bg-brand-teal text-white shadow-xl shadow-brand-teal/30' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-teal'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            <button 
              onClick={onRetry}
              title="Clique para forçar sincronização"
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all active:scale-95 ${
              dbStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' :
              dbStatus === 'SYNCING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
            }`}>
              {dbStatus === 'CONNECTED' ? <Cloud size={16} className="animate-pulse" /> : 
               dbStatus === 'SYNCING' ? <RefreshCw size={16} className="animate-spin" /> : <CloudOff size={16} />}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {dbStatus === 'CONNECTED' ? 'Supabase Ready' : 
                 dbStatus === 'SYNCING' ? 'Sincronizando...' : 'Conexão Offline'}
              </span>
            </button>

            <div className="bg-brand-tealDark p-4 rounded-2xl text-white shadow-xl flex items-center justify-between group">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-brand-green uppercase tracking-widest leading-none mb-1">{user.role}</p>
                <p className="text-xs font-bold truncate">{user.name}</p>
              </div>
              <button onClick={onLogout} title="Encerrar Sessão" className="p-2 hover:bg-red-500 rounded-xl text-white/60 hover:text-white transition-all active:scale-90 flex-shrink-0">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <NotificationCenter user={user} />
             <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-tealDark text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-teal/20 border-2 border-white">
                {user.name.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
