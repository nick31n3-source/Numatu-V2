
import React, { useMemo, useState } from 'react';
import { MapPin, Layers, Filter, Maximize2, MousePointer2, Info, Calendar, User as UserIcon, Navigation } from 'lucide-react';
import { CollectionData, User } from '../types';

interface GeoAnalysisViewProps {
  collections: CollectionData[];
  users: User[];
}

const GeoAnalysisView: React.FC<GeoAnalysisViewProps> = ({ collections, users }) => {
  const [filterNeighborhood, setFilterNeighborhood] = useState('Todos');
  const [selectedCollectorId, setSelectedCollectorId] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const collectors = useMemo(() => {
    return users.filter(u => u.role === 'COLLECTOR');
  }, [users]);

  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      const matchNeighborhood = filterNeighborhood === 'Todos' || c.neighborhood === filterNeighborhood;
      const matchCollector = selectedCollectorId === 'Todos' || c.id_coletor === selectedCollectorId;
      
      const colDate = new Date(c.ts_solicitada).toISOString().split('T')[0];
      const matchDate = !selectedDate || colDate === selectedDate;
      
      return matchNeighborhood && matchCollector && matchDate;
    });
  }, [collections, filterNeighborhood, selectedCollectorId, selectedDate]);

  // Sort filtered collections chronologically if a specific collector is selected to show a route
  const routePoints = useMemo(() => {
    if (selectedCollectorId === 'Todos') return [];
    return [...filteredCollections].sort((a, b) => {
      const timeA = new Date(a.ts_aceita || a.ts_solicitada).getTime();
      const timeB = new Date(b.ts_aceita || b.ts_solicitada).getTime();
      return timeA - timeB;
    });
  }, [filteredCollections, selectedCollectorId]);

  const neighborhoods = useMemo(() => {
    const set = new Set(collections.map(c => c.neighborhood));
    return ['Todos', ...Array.from(set)];
  }, [collections]);

  const topNeighborhoods = useMemo(() => {
    const map: Record<string, number> = {};
    let totalWeight = 0;
    collections.forEach(c => {
      map[c.neighborhood] = (map[c.neighborhood] || 0) + c.weight;
      totalWeight += c.weight;
    });

    return Object.entries(map)
      .map(([name, weight]) => ({ name, weight, pct: totalWeight > 0 ? (weight / totalWeight) * 100 : 0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }, [collections]);

  // Map projection helpers (keeping existing logic for consistency)
  const getX = (lng: number) => `${((lng + 46.8) * 450) % 90 + 5}%`;
  const getY = (lat: number) => `${((lat + 23.6) * 450) % 90 + 5}%`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header com Filtros Rápidos */}
      <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-3">
              <Navigation className="text-emerald-600" /> Roteirização e Logística
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">Monitore trajetos e produtividade de campo.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 ring-emerald-500/20"
              />
            </div>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase rounded-xl pl-9 pr-10 py-3 outline-none focus:ring-2 ring-emerald-500/20 appearance-none"
              >
                <option value="Todos">Todos Coletores</option>
                {collectors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <select 
              value={filterNeighborhood}
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase rounded-xl px-5 py-3 outline-none focus:ring-2 ring-emerald-500/20"
            >
              {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mock do Mapa Principal */}
        <div className="lg:col-span-3 bg-slate-100 rounded-[3rem] border-2 border-slate-200 h-[650px] relative overflow-hidden group shadow-inner">
          {/* Malha do Mapa */}
          <div className="absolute inset-0 bg-white/40 pattern-grid-lg"></div>
          
          {/* Route Lines (Drawn only if a collector is selected) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {routePoints.length > 1 && (
              <polyline
                points={routePoints.map(p => {
                  const x = parseFloat(getX(p.lng).replace('%', '')) * (6.5); // approximate scaling for svg viewport
                  const y = parseFloat(getY(p.lat).replace('%', '')) * (6.5);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#2A8EAB"
                strokeWidth="3"
                strokeDasharray="8 5"
                className="animate-[dash_20s_linear_infinite]"
              />
            )}
          </svg>
          <style>{`
            @keyframes dash {
              to { stroke-dashoffset: -200; }
            }
          `}</style>

          {filteredCollections.map((c) => (
            <div 
              key={c.id}
              className={`absolute w-10 h-10 -ml-5 -mt-10 cursor-pointer group transition-all animate-in zoom-in duration-300`}
              style={{ 
                left: getX(c.lng), 
                top: getY(c.lat) 
              }}
            >
              <div className="relative">
                <MapPin size={40} className={`fill-current stroke-white stroke-2 ${
                  c.status === 'CONCLUIDA' ? 'text-emerald-500' : 
                  c.status === 'EM_ROTA' ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[8px] font-black shadow-xl border border-slate-100 pointer-events-none opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-50">
                  <p className="text-slate-800">{c.material} • {c.weight}kg</p>
                  <p className="text-slate-400 text-[7px] uppercase tracking-widest">{c.neighborhood}</p>
                </div>
              </div>
            </div>
          ))}

          {/* HUD do Mapa */}
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> 
                {filteredCollections.length} Pontos de Parada
              </div>
            </div>
            {selectedCollectorId !== 'Todos' && routePoints.length > 0 && (
              <div className="bg-brand-teal text-white p-4 rounded-3xl shadow-xl flex items-center gap-3 animate-in slide-in-from-left-4">
                <Navigation size={18} />
                <div>
                  <p className="text-[10px] font-black uppercase leading-none mb-1">Rota Ativa</p>
                  <p className="text-[8px] font-bold opacity-80 uppercase">{collectors.find(u => u.id === selectedCollectorId)?.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Legenda Flutuante */}
          <div className="absolute bottom-8 right-8 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl max-w-xs border border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-5 flex items-center gap-2">
               <Info size={14} /> Monitoramento de Trajetos
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/30"></span>
                <span className="font-bold">Ciclo Concluído</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/30"></span>
                <span className="font-bold">Agente em Rota</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-slate-400 rounded-lg shadow-lg shadow-slate-400/30"></span>
                <span className="font-bold">Coleta Aguardando</span>
              </div>
              {selectedCollectorId !== 'Todos' && (
                <div className="flex items-center gap-3 text-xs border-t border-white/10 pt-3 mt-3">
                  <div className="w-4 h-[2px] bg-brand-teal border-t-2 border-dashed border-white/50"></div>
                  <span className="font-bold text-brand-teal">Sequência de Rota</span>
                </div>
              )}
            </div>
          </div>

          <button className="absolute top-6 right-6 bg-white p-3 rounded-2xl shadow-xl text-slate-600 hover:text-emerald-600 hover:scale-110 transition-all">
            <Maximize2 size={24} />
          </button>
        </div>

        {/* Estatísticas Geo */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
              <MousePointer2 size={14} className="text-blue-500" /> Histórico Geográfico
            </h3>
            <div className="space-y-6">
              {topNeighborhoods.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs items-end">
                    <span className="font-black italic uppercase text-slate-800">{item.name}</span>
                    <span className="text-slate-400 font-bold">{item.weight}kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
              {topNeighborhoods.length === 0 && (
                <p className="text-center text-slate-300 text-[10px] font-bold uppercase italic">Sem dados registrados</p>
              )}
            </div>
          </div>

          <div className="bg-brand-tealDark p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-sm font-black italic uppercase tracking-tighter mb-2 flex items-center gap-2 text-brand-green">
               Insights de Cobertura
            </h3>
            <p className="text-[10px] text-white/70 leading-relaxed mb-6 font-medium italic">
              {selectedCollectorId === 'Todos' 
                ? "Visualize trajetos individuais selecionando um coletor no filtro acima para analisar eficiência de deslocamento."
                : `Analisando rota de ${collectors.find(u => u.id === selectedCollectorId)?.name} para o dia ${selectedDate}.`
              }
            </p>
            <button className="w-full bg-brand-green text-brand-tealDark text-[10px] font-black py-4 rounded-2xl hover:bg-white hover:text-brand-tealDark transition-all uppercase tracking-widest shadow-lg active:scale-95">
              Exportar Log de Rota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoAnalysisView;
