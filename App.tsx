
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [allCollections, setAllCollections] = useState<CollectionData[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'SYNCING' | 'ERROR'>(
    DatabaseService.isCloud ? 'SYNCING' : 'CONNECTED'
  );

  const getDefaultTabForRole = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'overview';
      case 'ADVERTISER': return 'advertiser';
      case 'COLLECTOR': return 'geo';
      default: return 'auth';
    }
  };

  // Centralized logout logic to be passed as onLogout prop
  const handleLogout = useCallback(() => {
    DatabaseService.setSession(null);
    setCurrentUser(null);
  }, []);

  const refreshCollections = useCallback(async () => {
    try {
      const [collections, users] = await Promise.all([
        DatabaseService.getCollections(),
        DatabaseService.getUsers()
      ]);
      setAllCollections(collections);
      setAllUsers(users);
      setDbStatus('CONNECTED');
    } catch (err) {
      setDbStatus('ERROR');
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const [session, collections, users] = await Promise.all([
          DatabaseService.getSession(),
          DatabaseService.getCollections(),
          DatabaseService.getUsers()
        ]);
        setAllCollections(collections);
        setAllUsers(users);
        setDbStatus('CONNECTED');
        if (session) {
          setCurrentUser(session);
          setActiveTab(getDefaultTabForRole(session.role));
        }
      } catch (err) {
        setDbStatus('ERROR');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
    const unsubscribe = DatabaseService.subscribeToCollections(() => { refreshCollections(); });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [refreshCollections]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-teal font-black uppercase text-[10px] tracking-widest">Sincronizando NUMATU...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLogin={(user) => {
      setCurrentUser(user);
      DatabaseService.setSession(user);
      setActiveTab(getDefaultTabForRole(user.role));
    }} />;
  }

  if (currentUser.role !== 'ADMIN' && !currentUser.face_verified) {
    return <FacialVerification userName={currentUser.name} onVerified={(photo, gender) => {
      const updatedUser = { ...currentUser, face_verified: true, foto_perfil_url: photo, gender };
      setCurrentUser(updatedUser);
      DatabaseService.saveUser(updatedUser);
    }} />;
  }

  const renderContent = () => {
    const isAdmin = currentUser.role === 'ADMIN';
    switch (activeTab) {
      case 'overview': return isAdmin ? <DashboardView collections={allCollections} /> : renderContentForRole();
      case 'operational': return isAdmin ? <OperationalView collections={allCollections} /> : renderContentForRole();
      case 'advertiser': return <AdvertiserView user={currentUser} collections={allCollections} onUpdate={DatabaseService.saveCollection} onAdd={DatabaseService.saveCollection} onUpdateUser={(u) => { setCurrentUser(u); DatabaseService.saveUser(u); }} onLogout={handleLogout} />;
      case 'geo': return currentUser.role === 'COLLECTOR' ? <CollectorDashboard user={currentUser} collections={allCollections} onUpdate={DatabaseService.saveCollection} /> : <GeoAnalysisView collections={allCollections} users={allUsers} />;
      case 'reports': return isAdmin ? <ReportsView collections={allCollections} /> : renderContentForRole();
      case 'rules': return isAdmin ? <BusinessRulesView /> : renderContentForRole();
      case 'integration': return isAdmin ? <IntegrationView collections={allCollections} /> : renderContentForRole();
      case 'datamodel': return isAdmin ? <AdvicePanel /> : renderContentForRole();
      case 'gamification': return <GamificationView />;
      default: return renderContentForRole();
    }
  };

  const renderContentForRole = () => {
    if (currentUser.role === 'ADVERTISER') return <AdvertiserView user={currentUser} collections={allCollections} onUpdate={DatabaseService.saveCollection} onAdd={DatabaseService.saveCollection} onUpdateUser={(u) => { setCurrentUser(u); DatabaseService.saveUser(u); }} onLogout={handleLogout} />;
    if (currentUser.role === 'COLLECTOR') return <CollectorDashboard user={currentUser} collections={allCollections} onUpdate={DatabaseService.saveCollection} />;
    return <DashboardView collections={allCollections} />;
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} dbStatus={dbStatus} onRetry={() => refreshCollections()}>
      {renderContent()}
    </Layout>
  );
};

export default App;
