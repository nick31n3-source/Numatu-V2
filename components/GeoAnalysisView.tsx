
import React, { useMemo, useState } from 'react';
import { MapPin, Layers, Filter, Maximize2, MousePointer2, Info } from 'lucide-react';
import { CollectionData } from '../types';

interface GeoAnalysisViewProps {
  collections: CollectionData[];
}

const GeoAnalysisView: React.FC<GeoAnalysisViewProps> = ({ collections }) => {
  const [filterNeighborhood, setFilterNeighborhood] = useState('Todos');

  const filteredCollections = useMemo(() => {
    if (filterNeighborhood === 'Todos') return collections;
    return collections.filter(c => c.neighborhood === filterNeighborhood);
  }, [collections, filterNeighborhood]);

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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header com Filtros Rápidos */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-3">
            <MapPin className="text-emerald-600" /> Inteligência Geográfica
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase mt-1">Mapeamento dinâmico da rede NUMATU.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filterNeighborhood}
            onChange={(e) => setFilterNeighborhood(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-[10px] font-black uppercase rounded-xl px-5 py-3 outline-none focus:ring-2 ring-emerald-500/20"
          >
            {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg">
            <Layers size={14} /> Heatmap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mock do Mapa Principal */}
        <div className="lg:col-span-3 bg-slate-100 rounded-[3rem] border-2 border-slate-200 h-[650px] relative overflow-hidden group shadow-inner">
          {/* Marcadores Dinâmicos */}
          <div className="absolute inset-0 bg-white/40 pattern-grid-lg"></div>
          
          {filteredCollections.map((c, idx) => (
            <div 
              key={c.id}
              className={`absolute w-10 h-10 -ml-5 -mt-10 cursor-pointer group transition-all animate-in zoom-in duration-300`}
              style={{ 
                left: `${((c.lng + 46.8) * 450) % 90 + 5}%`, 
                top: `${((c.lat + 23.6) * 450) % 90 + 5}%` 
              }}
            >
              <div className="relative">
                <MapPin size={40} className={`fill-current stroke-white stroke-2 ${
                  c.status === 'CONCLUIDA' ? 'text-emerald-500' : 
                  c.status === 'EM_ROTA' ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.material}
                </div>
              </div>
            </div>
          ))}

          {/* HUD do Mapa */}
          <div className="absolute top-6 left-6 flex gap-2">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> 
                {filteredCollections.length} Pontos Visíveis
              </div>
            </div>
          </div>

          {/* Legenda Flutuante */}
          <div className="absolute bottom-8 right-8 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl max-w-xs border border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-5 flex items-center gap-2">
               <Info size={14} /> Legenda Operacional
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/30"></span>
                <span className="font-bold">Coleta Finalizada</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/30"></span>
                <span className="font-bold">Em Atendimento</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-4 h-4 bg-slate-400 rounded-lg shadow-lg shadow-slate-400/30"></span>
                <span className="font-bold">Aguardando Coletor</span>
              </div>
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
              <MousePointer2 size={14} className="text-blue-500" /> Bairros mais Ativos
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

          <div className="bg-emerald-900 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-100/50">
            <h3 className="text-sm font-black italic uppercase tracking-tighter mb-2 flex items-center gap-2 text-emerald-300">
               Otimização de Fluxo
            </h3>
            <p className="text-[10px] text-emerald-100/80 leading-relaxed mb-6 font-medium italic">
              Seu dashboard identificou que o bairro **{topNeighborhoods[0]?.name || '...'}** é o maior gerador atual. Sugerimos priorizar coletores de alta capacidade nesta zona.
            </p>
            <button className="w-full bg-emerald-500 text-white text-[10px] font-black py-4 rounded-2xl hover:bg-white hover:text-emerald-900 transition-all uppercase tracking-widest shadow-lg">
              Gerar Relatório Geo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoAnalysisView;
