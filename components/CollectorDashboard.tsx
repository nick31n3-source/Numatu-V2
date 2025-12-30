
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Navigation, Package, Truck, Radar, Check, Search, RefreshCw, AlertTriangle, Box, Map as MapIcon, XCircle, CheckCircle2, Navigation2, Zap } from 'lucide-react';
import { CollectionData, User } from '../types';
import { MATERIAL_PLACEHOLDERS } from '../constants';

interface CollectorDashboardProps {
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
}

// Cálculo de distância Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
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

// Mapeamento visual simples para o mock do mapa
const getPos = (val: number, offset: number) => {
  return ((val + offset) * 1000) % 80 + 10;
};

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user, collections, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'MARKET' | 'ROUTE'>('MARKET');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDesistirModalOpen, setIsDesistirModalOpen] = useState(false);
  const autoArrivalTriggered = useRef(false);

  const activeRoute = useMemo(() => 
    collections.find(c => c.id_coletor === user.id && ['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status)),
  [collections, user.id]);

  // GPS Tracking em tempo real (Estilo iFood)
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(newCoords);

        // CHECK AUTO-CHEGADA: 20 metros (0.02 km)
        if (activeRoute && activeRoute.status === 'EM_ROTA' && !autoArrivalTriggered.current) {
          const dist = calculateDistance(newCoords.lat, newCoords.lng, activeRoute.lat, activeRoute.lng);
          if (dist <= 0.02) {
            autoArrivalTriggered.current = true;
            onUpdate({ ...activeRoute, status: 'EM_COLETA' });
          }
        }
      },
      (err) => console.warn("GPS Indisponível:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeRoute, onUpdate]);

  const marketplaceItems = useMemo(() => {
    const items = collections.filter(c => c.status === 'ANUNCIADA');
    if (!userCoords) return items;
    // FILTRO AUTOMÁTICO: Ordenar por Proximidade
    return items.sort((a, b) => {
      const distA = calculateDistance(userCoords.lat, userCoords.lng, a.lat, a.lng);
      const distB = calculateDistance(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [collections, userCoords]);

  const collectorPos = { x: getPos(userCoords?.lng || 0, 46), y: getPos(userCoords?.lat || 0, 23) };
  const targetPos = { x: getPos(activeRoute?.lng || 0, 46), y: getPos(activeRoute?.lat || 0, 23) };
  const distanceToTarget = useMemo(() => {
    if (!userCoords || !activeRoute) return null;
    return calculateDistance(userCoords.lat, userCoords.lng, activeRoute.lat, activeRoute.lng);
  }, [userCoords, activeRoute]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
        <button onClick={() => setViewMode('MARKET')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'MARKET' ? 'bg-white text-brand-teal shadow-md' : 'text-slate-500'}`}>Marketplace</button>
        <button onClick={() => setViewMode('ROUTE')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'ROUTE' ? 'bg-white text-brand-teal shadow-md' : 'text-slate-500'}`}>Rotas Ativas {activeRoute && <span className="ml-2 w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>}</button>
      </div>

      {viewMode === 'MARKET' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceItems.map(c => (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group animate-in zoom-in">
              <div className="h-44 bg-slate-100 relative">
                <img src={c.foto_item_url || MATERIAL_PLACEHOLDERS[c.material]} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" />
                <div className="absolute top-4 right-4 bg-brand-teal text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg flex items-center gap-1">
                   <Navigation size={10} /> {userCoords ? `${calculateDistance(userCoords.lat, userCoords.lng, c.lat, c.lng).toFixed(1)} km` : 'Calculando...'}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-slate-800 uppercase italic tracking-tighter">{c.companyName}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.material} • {c.weight}kg • {c.neighborhood}</p>
                <button onClick={() => {
                  autoArrivalTriggered.current = false;
                  onUpdate({...c, id_coletor: user.id, status: 'ACEITA', ts_aceita: new Date().toISOString(), codigo_confirmacao: Math.floor(100000 + Math.random() * 900000).toString()});
                  setViewMode('ROUTE');
                }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase hover:bg-brand-teal transition-all active:scale-95 shadow-lg">Aceitar Carga</button>
              </div>
            </div>
          ))}
          {marketplaceItems.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
               <Radar size={48} className="mx-auto text-slate-200 animate-pulse" />
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Buscando empresas ativas...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-4">
          {activeRoute ? (
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
              {/* MAPA iFood FIXO */}
              <div className="h-[480px] bg-slate-50 relative border-b border-slate-100 overflow-hidden">
                <div className="absolute inset-0 pattern-grid-lg opacity-10"></div>
                
                {/* Polyline da Rota */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line 
                    x1={`${collectorPos.x}%`} y1={`${collectorPos.y}%`} 
                    x2={`${targetPos.x}%`} y2={`${targetPos.y}%`} 
                    stroke="#2A8EAB" strokeWidth="4" strokeDasharray="10 8" 
                    className="animate-[dash_8s_linear_infinite] opacity-60"
                  />
                </svg>
                <style>{`@keyframes dash { to { stroke-dashoffset: -100; } }`}</style>

                {/* Destino Pin */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000" style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}>
                  <div className="relative group">
                    <MapPin size={48} className="text-red-500 fill-red-500/10 drop-shadow-2xl" />
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap shadow-xl">Local de Coleta</div>
                  </div>
                </div>

                {/* Coletor Pin (GPS) */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${collectorPos.x}%`, top: `${collectorPos.y}%` }}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-teal/30 rounded-full animate-ping"></div>
                    <div className="bg-brand-teal p-3.5 rounded-2xl border-2 border-white text-white shadow-2xl rotate-[135deg]">
                       <Navigation2 size={24} className="fill-current" />
                    </div>
                  </div>
                </div>

                {/* Status Float Banner */}
                <div className="absolute bottom-8 inset-x-8">
                  <div className={`p-8 rounded-[2.5rem] shadow-2xl border flex items-center justify-between backdrop-blur-xl transition-all duration-700 ${
                    activeRoute.status === 'EM_COLETA' ? 'bg-emerald-500/90 border-emerald-400 text-white scale-105' : 'bg-white/90 border-slate-100'
                  }`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${activeRoute.status === 'EM_COLETA' ? 'text-white/80' : 'text-slate-400'}`}>
                        {activeRoute.status === 'EM_COLETA' ? 'Chegada Confirmada' : 'Acompanhando Rota'}
                      </p>
                      <h4 className="text-xl font-black uppercase italic tracking-tighter">
                        {activeRoute.status === 'EM_COLETA' ? 'COLETOR CHEGOU! ✓' : `${distanceToTarget?.toFixed(2)}km • 5 min`}
                      </h4>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeRoute.status === 'EM_COLETA' ? 'bg-white text-emerald-600' : 'bg-brand-teal text-white shadow-lg'}`}>
                      {activeRoute.status === 'EM_COLETA' ? <Check size={32} /> : <Zap size={24} className="animate-pulse" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes e Ações */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                   <img src={activeRoute.companyAvatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                   <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-brand-teal tracking-widest">{activeRoute.material}</p>
                      <p className="font-black text-slate-800 uppercase italic tracking-tighter text-lg">{activeRoute.companyName}</p>
                   </div>
                </div>

                {activeRoute.status === 'ACEITA' && (
                  <button onClick={() => onUpdate({...activeRoute, status: 'EM_ROTA', ts_em_rota: new Date().toISOString()})} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Iniciar Navegação</button>
                )}

                {activeRoute.status === 'EM_COLETA' && (
                  <div className="bg-emerald-50 border-4 border-emerald-500 p-8 rounded-[3rem] text-center animate-in zoom-in">
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-widest">Apresente este Token ao Gerador</p>
                      <p className="text-7xl font-black text-slate-900 tracking-[0.2em] font-mono">{activeRoute.codigo_confirmacao}</p>
                  </div>
                )}

                <button onClick={() => setIsDesistirModalOpen(true)} className="w-full text-slate-300 font-bold uppercase text-[9px] tracking-widest hover:text-red-500 transition-all flex items-center justify-center gap-2 mt-4">
                  <XCircle size={14} /> Cancelar Coleta
                </button>
              </div>
            </div>
          ) : (
            <div className="py-32 text-center space-y-6">
              <Box size={64} className="mx-auto text-slate-100" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sem rotas ativas no momento.</p>
              <button onClick={() => setViewMode('MARKET')} className="bg-brand-teal text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Abrir Marketplace</button>
            </div>
          )}
        </div>
      )}

      {/* Modal Desistir */}
      {isDesistirModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-8 max-w-xs w-full animate-in zoom-in">
            <AlertTriangle size={64} className="mx-auto text-red-500" />
            <h3 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Confirmar Abandono?</h3>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">Sua reputação será afetada e a carga voltará para outros coletores.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {
                if (activeRoute) onUpdate({ ...activeRoute, status: 'ANUNCIADA', id_coletor: '', _abandoned: true } as any);
                setIsDesistirModalOpen(false);
                setViewMode('MARKET');
              }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-lg">Abandonar Rota</button>
              <button onClick={() => setIsDesistirModalOpen(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px]">Voltar para o Mapa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
