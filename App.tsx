
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import AuthView from './components/AuthView';
import DashboardView from './components/Dashboard';
import AdvicePanel from './components/AdvicePanel';
import OperationalView from './components/OperationalView';
import BusinessRulesView from './components/BusinessRulesView';
import GeoAnalysisView from './components/GeoAnalysisView';
import IntegrationView from './components/IntegrationView';
import GamificationView from './components/GamificationView';
import AdvertiserView from './components/AdvertiserView';
import CollectorDashboard from './components/CollectorDashboard';
import ReportsView from './components/ReportsView';
import FacialVerification from './components/FacialVerification';
import { User, CollectionData } from './types';
import { DatabaseService } from './database';
import { ShieldAlert, RefreshCw, Trash2, HardDrive, Bell, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [allCollections, setAllCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'SYNCING' | 'ERROR'>('CONNECTED');
  const [toast, setToast] = useState<{message: string, type: 'SUCCESS' | 'INFO'} | null>(null);

  // Helper seguro para acessar a API Key
  const getApiKey = () => {
    try {
      return process.env.API_KEY;
    } catch (e) {
      return undefined;
    }
  };

  const showToast = useCallback((message: string, type: 'SUCCESS' | 'INFO' = 'INFO') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        const [session, collections] = await Promise.all([
          DatabaseService.getSession(),
          DatabaseService.getCollections()
        ]);
        setAllCollections(collections);
        if (session) setCurrentUser(session);
        setDbStatus('CONNECTED');
      } catch (e) {
        setDbStatus('ERROR');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();

    const handleDataChange = (e: any) => {
      const { type, data } = e.detail;
      if (type === 'COLLECTION' && currentUser) {
        if (data.status === 'ANUNCIADA' && currentUser.role === 'COLLECTOR') {
          showToast(`Nova oportunidade de coleta em ${data.neighborhood}`, 'INFO');
        } else if (data.status === 'ACEITA' && currentUser.role === 'ADVERTISER' && data.id_anunciante === currentUser.id) {
          showToast(`Um coletor aceitou sua carga de ${data.material}!`, 'SUCCESS');
        }
      }
    };

    window.addEventListener('numatu_data_change', handleLocalChange);
    function handleLocalChange(e: any) { handleDataChange(e); }

    return () => window.removeEventListener('numatu_data_change', handleLocalChange);
  }, [currentUser?.id, currentUser?.role, showToast]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') setActiveTab('overview');
      else if (currentUser.role === 'ADVERTISER') setActiveTab('advertiser');
      else if (currentUser.role === 'COLLECTOR') setActiveTab('geo');
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleLogin = async (user: User) => {
    await DatabaseService.setSession(user);
    setCurrentUser(user);
    showToast(`Bem-vindo, ${user.name}!`, 'INFO');
  };

  const handleLogout = async () => {
    await DatabaseService.setSession(null);
    setCurrentUser(null);
  };

  const updateCollection = useCallback(async (updated: CollectionData) => {
    setDbStatus('SYNCING');
    try {
      await DatabaseService.saveCollection(updated);
      setAllCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
      setDbStatus('CONNECTED');
    } catch (e) {
      setDbStatus('ERROR');
    }
  }, []);

  const addCollection = useCallback(async (newCol: CollectionData) => {
    setDbStatus('SYNCING');
    try {
      await DatabaseService.saveCollection(newCol);
      setAllCollections(prev => [newCol, ...prev]);
      setDbStatus('CONNECTED');
      showToast("Carga publicada com sucesso!", "SUCCESS");
    } catch (e) {
      setDbStatus('ERROR');
    }
  }, [showToast]);

  const updateCurrentUser = useCallback(async (updatedUser: User) => {
    setDbStatus('SYNCING');
    try {
      await DatabaseService.saveUser(updatedUser);
      setCurrentUser(updatedUser);
      setDbStatus('CONNECTED');
    } catch (e) {
      setDbStatus('ERROR');
    }
  }, []);

  const handleFaceVerified = async (photoUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, face_verified: true, foto_perfil_url: photoUrl };
    await updateCurrentUser(updatedUser);
    showToast("Biometria verificada com sucesso!", "SUCCESS");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-tealDark flex flex-col items-center justify-center text-white p-10">
        <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
        <h1 className="text-sm font-black italic uppercase tracking-widest mt-6 animate-pulse">Iniciando NUMATU...</h1>
      </div>
    );
  }

  if (!currentUser) return <AuthView onLogin={handleLogin} />;

  if (currentUser && !currentUser.face_verified && currentUser.role !== 'ADMIN') {
    return <FacialVerification userName={currentUser.name} onVerified={handleFaceVerified} />;
  }

  const isVerified = currentUser.role === 'ADMIN' || (currentUser.email_verificado && currentUser.telefone_verificado && currentUser.isProfileComplete);

  const renderContent = () => {
    if (!isVerified) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-12 bg-white rounded-[4rem] border border-slate-200 shadow-xl max-w-2xl mx-auto">
           <ShieldAlert size={48} className="text-amber-500 mb-6" />
           <h2 className="text-3xl font-black text-slate-800 italic uppercase">Acesso Bloqueado</h2>
           <p className="text-slate-500 mt-4 font-medium">Conta aguardando verificação manual da moderação.</p>
           <button onClick={() => window.location.reload()} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Recarregar</button>
        </div>
      );
    }

    const apiKey = getApiKey();

    switch (activeTab) {
      case 'overview': return <DashboardView collections={allCollections} />;
      case 'advertiser': return <AdvertiserView user={currentUser} collections={allCollections} onUpdate={updateCollection} onAdd={addCollection} onUpdateUser={updateCurrentUser} />;
      case 'geo': return currentUser.role === 'COLLECTOR' ? <CollectorDashboard user={currentUser} collections={allCollections} onUpdate={updateCollection} /> : <GeoAnalysisView collections={allCollections} />;
      case 'reports': return <ReportsView collections={allCollections} />;
      case 'operational': return <OperationalView collections={allCollections} />;
      case 'gamification': return <GamificationView />;
      case 'rules': return <BusinessRulesView />;
      case 'integration': return <IntegrationView />;
      case 'datamodel': return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
           <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl border border-emerald-500/20"><HardDrive size={32} /></div>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase italic">Deploy Integrity Monitor</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Host: {window.location.hostname}</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">IA Engine Status</p>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></div>
                       <span className="text-xs font-bold text-slate-200">{apiKey ? 'Conectado (Gemini)' : 'API Key Ausente'}</span>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Protocolo HTTPS</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                       <span className="text-xs font-bold text-slate-200">{window.location.protocol === 'https:' ? 'Seguro' : 'Inseguro (Câmera pode falhar)'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] space-y-4">
                  <div className="flex items-center gap-2 text-red-600"><Trash2 size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Zona de Perigo</span></div>
                  <p className="text-xs text-red-700/60 font-medium italic">Esta ação limpa o cache local e reseta o sistema para o deploy inicial.</p>
                  <button onClick={() => DatabaseService.clearDatabase()} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl">
                    <RefreshCw size={16} /> Resetar Instância
                  </button>
              </div>
           </div>
        </div>
      );
      case 'guide': return <AdvicePanel />;
      default: return <DashboardView collections={allCollections} />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 animate-in slide-in-from-top-full duration-500">
          <div className={`p-4 rounded-3xl shadow-2xl border flex items-center gap-4 ${
            toast.type === 'SUCCESS' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-brand-tealDark border-brand-teal text-white'
          }`}>
            <div className="bg-white/20 p-2 rounded-full">
              {toast.type === 'SUCCESS' ? <CheckCircle2 size={20} /> : <Bell size={20} />}
            </div>
            <p className="text-xs font-black uppercase tracking-tight flex-1 leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} dbStatus={dbStatus}>
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;
