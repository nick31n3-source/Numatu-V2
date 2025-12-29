
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
import { RefreshCw, Trash2, HardDrive } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('numatu_active_tab') || 'overview');
  const [allCollections, setAllCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCollections = useCallback(async () => {
    const collections = await DatabaseService.getCollections();
    setAllCollections(collections);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const [session, collections] = await Promise.all([
        DatabaseService.getSession(),
        DatabaseService.getCollections()
      ]);
      setAllCollections(collections);
      if (session) setCurrentUser(session);
      setIsLoading(false);
    };
    initApp();
  }, []);

  const handleLogin = async (user: User) => {
    await DatabaseService.setSession(user);
    setCurrentUser(user);
    const defaultTab = user.role === 'ADMIN' ? 'overview' : (user.role === 'ADVERTISER' ? 'advertiser' : 'geo');
    setActiveTab(defaultTab);
  };

  const handleLogout = async () => {
    await DatabaseService.setSession(null);
    setCurrentUser(null);
    setActiveTab('overview');
  };

  const updateCollection = async (updated: CollectionData) => {
    await DatabaseService.saveCollection(updated);
    await refreshCollections();
  };

  const addCollection = async (newCol: CollectionData) => {
    await DatabaseService.saveCollection(newCol);
    await refreshCollections();
  };

  const updateCurrentUser = async (updatedUser: User) => {
    await DatabaseService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-brand-tealDark flex flex-col items-center justify-center text-white p-6">
      <RefreshCw className="animate-spin text-brand-green mb-4" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.3em]">Carregando...</p>
    </div>
  );

  if (!currentUser) return <AuthView onLogin={handleLogin} />;

  if (!currentUser.face_verified && currentUser.role !== 'ADMIN') {
    return <FacialVerification userName={currentUser.name} onVerified={(img) => updateCurrentUser({...currentUser, face_verified: true, foto_perfil_url: img})} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout}>
      {(() => {
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
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 text-white">
                <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-3"><HardDrive /> Console</h3>
                <button onClick={() => DatabaseService.clearDatabase()} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] flex items-center gap-2">
                  <Trash2 size={16} /> Resetar App
                </button>
              </div>
            </div>
          );
          case 'guide': return <AdvicePanel />;
          default: return <DashboardView collections={allCollections} />;
        }
      })()}
    </Layout>
  );
};

export default App;
