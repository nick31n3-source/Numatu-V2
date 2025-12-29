
import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Navigation, Package, Truck, Radar, Check, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { CollectionData, User } from '../types';

interface CollectorDashboardProps {
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const ARRIVAL_RADIUS_KM = 0.3; 

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user, collections, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'MARKET' | 'ROUTE'>('MARKET');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [now, setNow] = useState(new Date());
  const [isDesistirModalOpen, setIsDesistirModalOpen] = useState(false);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      null,
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketplaceItems = useMemo(() => 
    collections.filter(c => c.status === 'ANUNCIADA'),
  [collections]);

  const activeRoute = useMemo(() => 
    collections.find(c => c.id_coletor === user.id && ['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status)),
  [collections, user.id]);

  useEffect(() => {
    if (activeRoute && userCoords && activeRoute.status === 'EM_ROTA') {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, activeRoute.lat, activeRoute.lng);
      if (dist <= ARRIVAL_RADIUS_KM) {
        onUpdate({ ...activeRoute, status: 'EM_COLETA' });
      }
    }
  }, [userCoords, activeRoute, onUpdate]);

  const handleAccept = (col: CollectionData) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 45);
    onUpdate({
      ...col,
      id_coletor: user.id,
      status: 'ACEITA',
      ts_aceita: new Date().toISOString(),
      ts_expiracao: expiration.toISOString(),
      codigo_confirmacao: code
    });
    setViewMode('ROUTE');
  };

  const handleIniciarDeslocamento = () => {
    if (activeRoute) onUpdate({ ...activeRoute, status: 'EM_ROTA', ts_em_rota: new Date().toISOString() });
  };

  const handleConfirmarDesistencia = () => {
    if (activeRoute) onUpdate({ ...activeRoute, status: 'ANUNCIADA', id_coletor: undefined, ts_aceita: undefined });
    setIsDesistirModalOpen(false);
    setViewMode('MARKET');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setViewMode('MARKET')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'MARKET' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Marketplace</button>
        <button onClick={() => setViewMode('ROUTE')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'ROUTE' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Rota Ativa</button>
      </div>

      {viewMode === 'MARKET' ? (
        marketplaceItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceItems.map(c => (
              <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <div className="h-40 relative">
                  <img src={c.foto_item_url} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 text-white font-black italic uppercase tracking-tighter text-xl bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">{c.material}</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">{c.neighborhood}</span>
                    <span className="bg-brand-teal text-white px-2 py-0.5 rounded text-[10px] font-bold">{c.weight}kg</span>
                  </div>
                  <button onClick={() => handleAccept(c)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase">Aceitar Missão</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 bg-white rounded-[3rem] border border-slate-200 text-center space-y-4">
            <Search className="mx-auto text-slate-200" size={48} />
            <p className="text-slate-400 font-bold uppercase text-xs">Aguardando novos anúncios...</p>
            <button onClick={() => window.location.reload()} className="text-brand-teal text-[10px] font-black uppercase underline flex items-center gap-2 mx-auto"><RefreshCw size={12} /> Atualizar</button>
          </div>
        )
      ) : (
        activeRoute ? (
          <div className="max-w-xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
             <div className={`p-8 text-white ${activeRoute.status === 'EM_COLETA' ? 'bg-brand-green' : 'bg-brand-tealDark'} flex justify-between items-center`}>
                <div className="flex items-center gap-4">
                   <Truck size={32} />
                   <h2 className="text-xl font-black uppercase italic tracking-tighter">{activeRoute.status === 'EM_COLETA' ? 'No Local' : 'Em Rota'}</h2>
                </div>
                <Radar className="animate-pulse" />
             </div>
             <div className="p-10 space-y-8">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400">Destino</label>
                   <p className="text-lg font-black text-slate-800 italic uppercase leading-tight mt-1">{activeRoute.companyName}</p>
                   <p className="text-sm font-bold text-slate-500 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">{activeRoute.address}</p>
                </div>
                {activeRoute.status === 'ACEITA' && <button onClick={handleIniciarDeslocamento} className="w-full bg-brand-teal text-white py-5 rounded-xl font-black uppercase text-xs">Iniciar Rota</button>}
                {activeRoute.status === 'EM_COLETA' && (
                  <div className="bg-brand-green/10 p-6 rounded-2xl border-2 border-brand-green text-center space-y-4 animate-in zoom-in">
                    <p className="text-[10px] font-black text-brand-greenDark uppercase">Código Handshake</p>
                    <p className="text-5xl font-black text-slate-800 font-mono tracking-widest">{activeRoute.codigo_confirmacao}</p>
                  </div>
                )}
                <button onClick={() => setIsDesistirModalOpen(true)} className="w-full py-4 text-red-400 font-black uppercase text-[10px] hover:underline">Abandonar Carga</button>
             </div>
          </div>
        ) : <div className="text-center py-20 text-slate-400 uppercase text-xs font-bold">Vá ao Marketplace!</div>
      )}

      {isDesistirModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-10 text-center space-y-6">
            <AlertTriangle className="mx-auto text-red-500" size={40} />
            <h3 className="font-black uppercase italic text-slate-800">Liberar Carga?</h3>
            <p className="text-slate-500 text-xs font-medium">Outro parceiro poderá assumir esta missão.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleConfirmarDesistencia} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Sim, Desistir</button>
              <button onClick={() => setIsDesistirModalOpen(false)} className="w-full bg-slate-50 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
