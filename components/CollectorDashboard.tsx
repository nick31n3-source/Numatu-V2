
import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Navigation, Package, Truck, Radar, Check, Search, RefreshCw, AlertTriangle, Box, Map as MapIcon, XCircle, ChevronRight, ArrowUpRight, LocateFixed } from 'lucide-react';
import { CollectionData, User } from '../types';

interface CollectorDashboardProps {
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
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

const getPos = (val: number, offset: number, scale: number = 450) => {
  return ((val + offset) * scale) % 80 + 10;
};

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user, collections, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'MARKET' | 'ROUTE'>('MARKET');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDesistirModalOpen, setIsDesistirModalOpen] = useState(false);
  const [useFallbackLoc, setUseFallbackLoc] = useState(false);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseFallbackLoc(false);
      },
      (err) => {
        console.warn("GPS desativado ou erro:", err.message);
        // Não define fallback automático para não quebrar a lógica de "perto de você" sem aviso
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const activateFallback = () => {
    setUserCoords({ lat: -23.5505, lng: -46.6333 }); // Centro de SP
    setUseFallbackLoc(true);
  };

  // FILTRO POR RAIO DE 120KM
  const marketplaceItems = useMemo(() => {
    return collections.filter(c => {
      const isAvailable = c.status === 'ANUNCIADA' && (!c.id_coletor || c.id_coletor === '');
      if (!isAvailable) return false;

      if (userCoords) {
        const dist = calculateDistance(userCoords.lat, userCoords.lng, c.lat, c.lng);
        return dist <= 120;
      }
      return false;
    });
  }, [collections, userCoords]);

  const activeRoute = useMemo(() => 
    collections.find(c => c.id_coletor === user.id && ['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status)),
  [collections, user.id]);

  const handleAccept = (col: CollectionData) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 60);
    
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

  const handleFinalizarChegada = () => {
    if (activeRoute) onUpdate({ ...activeRoute, status: 'EM_COLETA' });
  };

  const handleConfirmarDesistencia = () => {
    if (activeRoute) {
      onUpdate({ 
        ...activeRoute, 
        status: 'ANUNCIADA', 
        id_coletor: '', 
        ts_aceita: undefined,
        ts_em_rota: undefined,
        codigo_confirmacao: undefined,
        _abandoned: true 
      } as any);
    }
    setIsDesistirModalOpen(false);
    setViewMode('MARKET');
  };

  const distanceToTarget = useMemo(() => {
    if (!userCoords || !activeRoute) return null;
    return calculateDistance(userCoords.lat, userCoords.lng, activeRoute.lat, activeRoute.lng).toFixed(1);
  }, [userCoords, activeRoute]);

  const collectorPos = { x: getPos(userCoords?.lng || -46.63, 46.8), y: getPos(userCoords?.lat || -23.55, 23.6) };
  const targetPos = { x: getPos(activeRoute?.lng || -46.63, 46.8), y: getPos(activeRoute?.lat || -23.55, 23.6) };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setViewMode('MARKET')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'MARKET' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Marketplace</button>
        <button onClick={() => setViewMode('ROUTE')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'ROUTE' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Rota Ativa</button>
      </div>

      {viewMode === 'MARKET' ? (
        <div className="space-y-6">
          <div className="bg-brand-tealDark p-8 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden shadow-2xl">
             <div className="relative z-10">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Marketplace</h2>
                <p className="text-[9px] font-bold text-brand-green uppercase tracking-widest mt-1">Filtro de 120km Ativo</p>
             </div>
             <Radar className="text-brand-green animate-pulse" size={32} />
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          {!userCoords && (
             <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] text-center space-y-6 animate-pulse shadow-sm">
                <RefreshCw className="animate-spin text-brand-teal mx-auto" size={32} />
                <div className="space-y-2">
                    <p className="text-slate-500 font-black uppercase text-xs">Sincronizando sua posição...</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold px-10">Precisamos do seu GPS para garantir que as cargas estejam no seu raio de atuação.</p>
                </div>
                <button onClick={activateFallback} className="text-[10px] font-black text-brand-teal uppercase flex items-center gap-2 mx-auto hover:underline">
                    <LocateFixed size={14} /> Usar Localização Padrão (São Paulo)
                </button>
             </div>
          )}

          {userCoords && useFallbackLoc && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-600 text-[9px] font-black uppercase">
                    <AlertTriangle size={16} /> Você está usando localização manual (SP)
                </div>
                <button onClick={() => window.location.reload()} className="text-[8px] font-black text-amber-700 underline uppercase">Tentar GPS Real</button>
            </div>
          )}

          {userCoords && marketplaceItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceItems.map(c => (
                <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all border-b-4 hover:border-brand-green group">
                  <div className="h-44 relative overflow-hidden">
                    <img src={c.foto_item_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-brand-teal text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg">{c.material}</div>
                    {userCoords && (
                       <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black uppercase text-brand-teal flex items-center gap-1 shadow-sm">
                          <MapPin size={10} /> {calculateDistance(userCoords.lat, userCoords.lng, c.lat, c.lng).toFixed(1)} km
                       </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="font-black text-slate-800 italic uppercase leading-tight truncate">{c.companyName}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase">
                      <MapIcon size={12} /> {c.neighborhood}
                    </div>
                    <button onClick={() => handleAccept(c)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-brand-teal transition-all shadow-lg active:scale-95">
                      <Truck size={14} /> Aceitar Carga
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : userCoords && (
            <div className="py-32 bg-white rounded-[3rem] border border-slate-200 text-center space-y-4 shadow-sm">
              <Search className="text-slate-200 mx-auto" size={48} />
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase text-xs">Radar Vazio</p>
                <p className="text-[10px] text-slate-300 font-bold uppercase">Não encontramos cargas em um raio de 120km da sua posição atual.</p>
              </div>
              <button onClick={() => window.location.reload()} className="text-[10px] font-black text-brand-teal uppercase underline tracking-widest">Atualizar Lista</button>
            </div>
          )}
        </div>
      ) : (
        activeRoute ? (
          <div className="max-w-xl mx-auto space-y-4">
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className={`p-8 text-white ${activeRoute.status === 'EM_COLETA' ? 'bg-emerald-600' : 'bg-brand-tealDark'} flex justify-between items-center transition-colors duration-500`}>
                   <div className="flex items-center gap-4">
                      <Truck size={24} className="text-brand-green" />
                      <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">Missão Ativa</h2>
                        <p className="text-[9px] font-black uppercase text-white/50 tracking-widest">{activeRoute.id}</p>
                      </div>
                   </div>
                   {distanceToTarget && (
                     <div className="text-right">
                       <span className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-xl block">{distanceToTarget} km</span>
                     </div>
                   )}
                </div>

                <div className="h-60 bg-slate-100 relative overflow-hidden border-b border-slate-200 shadow-inner">
                   <div className="absolute inset-0 pattern-grid-lg opacity-20"></div>
                   
                   <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <path 
                        d={`M ${collectorPos.x}% ${collectorPos.y}% L ${targetPos.x}% ${targetPos.y}%`} 
                        stroke="#2A8EAB" 
                        strokeWidth="5" 
                        strokeDasharray="12 8" 
                        fill="none" 
                        className={activeRoute.status === 'EM_ROTA' ? 'animate-[dash_1.5s_linear_infinite]' : ''} 
                      />
                      <style>{`@keyframes dash { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }`}</style>
                   </svg>

                   <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000" style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}>
                     <MapPin size={36} className="text-red-600 fill-red-600/20 drop-shadow-md" />
                   </div>

                   <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 shadow-2xl" style={{ left: `${collectorPos.x}%`, top: `${collectorPos.y}%` }}>
                     <div className="bg-brand-teal p-3 rounded-2xl border-4 border-white text-white rotate-[-45deg] animate-pulse">
                       <Truck size={18} className="rotate-[45deg]" />
                     </div>
                   </div>

                   <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 text-[9px] font-black uppercase flex items-center gap-2 shadow-sm">
                      <ArrowUpRight size={14} className="text-brand-teal" /> Navegação Operacional
                   </div>
                </div>

                <div className="p-10 space-y-6">
                   <div className="bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Local de Retirada</p>
                      <p className="font-black text-slate-800 uppercase italic text-xl leading-none mt-2">{activeRoute.companyName}</p>
                      <p className="text-sm font-bold text-slate-500 mt-3 flex items-center gap-2">
                        <MapIcon size={14} className="text-brand-teal" /> {activeRoute.address}
                      </p>
                   </div>

                   {activeRoute.status === 'ACEITA' && (
                     <button onClick={handleIniciarDeslocamento} className="w-full bg-brand-teal text-white py-7 rounded-[2rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">
                       Iniciar Deslocamento
                     </button>
                   )}

                   {activeRoute.status === 'EM_ROTA' && (
                     <button onClick={handleFinalizarChegada} className="w-full bg-brand-green text-brand-tealDark py-8 rounded-[2rem] font-black uppercase text-sm shadow-xl active:scale-95 border-b-8 border-brand-greenDark transition-all">
                       Confirmar Chegada no Local
                     </button>
                   )}

                   {activeRoute.status === 'EM_COLETA' && (
                     <div className="bg-emerald-50 p-10 rounded-[3rem] border-4 border-brand-green text-center space-y-6 shadow-inner animate-in zoom-in">
                       <p className="text-[11px] font-black text-brand-greenDark uppercase tracking-widest">Handshake Digital</p>
                       <div className="bg-white p-8 rounded-3xl border-2 border-brand-green/20 shadow-2xl inline-block">
                         <p className="text-6xl font-black text-slate-800 font-mono tracking-[0.2em]">{activeRoute.codigo_confirmacao}</p>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">Apresente este código ao anunciante.</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="px-2">
               <button onClick={() => setIsDesistirModalOpen(true)} className="w-full bg-red-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-red-700 active:scale-95 border-b-4 border-red-900 transition-all">
                 <XCircle size={20} /> Desistir desta Missão
               </button>
             </div>
          </div>
        ) : (
          <div className="text-center py-32 space-y-6">
            <Box className="text-slate-300 mx-auto" size={56} />
            <p className="text-slate-500 uppercase text-sm font-black tracking-widest">Aguardando Missões.</p>
            <button onClick={() => setViewMode('MARKET')} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all">Ir para o Marketplace</button>
          </div>
        )
      )}

      {isDesistirModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white max-w-sm w-full rounded-[4rem] p-12 text-center space-y-10 border-4 border-red-50 animate-in zoom-in duration-300">
            <AlertTriangle className="mx-auto text-red-600" size={56} />
            <div>
              <h3 className="font-black uppercase italic text-slate-900 text-2xl tracking-tighter leading-none">Confirmar Abandono?</h3>
              <p className="text-slate-500 text-[11px] font-bold uppercase mt-6 leading-relaxed">A carga voltará imediatamente para o marketplace público.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={handleConfirmarDesistencia} className="w-full bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 hover:bg-red-700 transition-all">Sim, Liberar Carga</button>
              <button onClick={() => setIsDesistirModalOpen(false)} className="w-full bg-slate-100 text-slate-500 py-5 rounded-3xl font-black uppercase text-xs active:scale-95">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
