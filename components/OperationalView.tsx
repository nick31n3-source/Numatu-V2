
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { CollectionData } from '../types';

interface OperationalViewProps {
  collections: CollectionData[];
}

const OperationalView: React.FC<OperationalViewProps> = ({ collections }) => {
  const stats = useMemo(() => {
    const statusCounts = {
      'ANUNCIADA': 0,
      'ACEITA': 0,
      'EM_ROTA': 0,
      'CONCLUIDA': 0,
      'CANCELADA': 0
    };

    let totalLeadTime = 0;
    let leadTimeCount = 0;
    let criticalCount = 0;
    const now = new Date();

    collections.forEach(c => {
      statusCounts[c.status]++;
      
      // Cálculo de SLA/Lead Time
      if (c.ts_aceita && c.ts_solicitada) {
        const diff = (new Date(c.ts_aceita).getTime() - new Date(c.ts_solicitada).getTime()) / 60000;
        totalLeadTime += diff;
        leadTimeCount++;
      }

      // Alertas Críticos (Pendente > 2h)
      if (c.status === 'ANUNCIADA') {
        const hoursPending = (now.getTime() - new Date(c.ts_solicitada).getTime()) / (1000 * 60 * 60);
        if (hoursPending > 2) criticalCount++;
      }
    });

    const avgResponseTime = leadTimeCount > 0 ? Math.round(totalLeadTime / leadTimeCount) : 0;
    const completionRate = collections.length > 0 
      ? ((statusCounts['CONCLUIDA'] / collections.length) * 100).toFixed(1) 
      : "0.0";

    return { statusCounts, avgResponseTime, criticalCount, completionRate };
  }, [collections]);

  const chartData = [
    { name: 'Pendente', value: stats.statusCounts['ANUNCIADA'], color: '#94a3b8' },
    { name: 'Aceita', value: stats.statusCounts['ACEITA'], color: '#60a5fa' },
    { name: 'Em Rota', value: stats.statusCounts['EM_ROTA'], color: '#f59e0b' },
    { name: 'Concluída', value: stats.statusCounts['CONCLUIDA'], color: '#10b981' },
    { name: 'Cancelada', value: stats.statusCounts['CANCELADA'], color: '#ef4444' },
  ];

  const neighborhoodGargalos = useMemo(() => {
    const map: Record<string, { pending: number, totalTime: number, count: number }> = {};
    collections.forEach(c => {
      if (!map[c.neighborhood]) map[c.neighborhood] = { pending: 0, totalTime: 0, count: 0 };
      if (c.status === 'ANUNCIADA') map[c.neighborhood].pending++;
      if (c.ts_aceita) {
        map[c.neighborhood].totalTime += (new Date(c.ts_aceita).getTime() - new Date(c.ts_solicitada).getTime()) / 60000;
        map[c.neighborhood].count++;
      }
    });

    return Object.entries(map).map(([name, data]) => ({
      neighborhood: name,
      pending: data.pending,
      avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0
    })).sort((a, b) => b.pending - a.pending).slice(0, 4);
  }, [collections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Clock size={18} />
            <span className="text-[10px] font-black uppercase">Tempo Médio Resposta</span>
          </div>
          <p className="text-3xl font-black italic uppercase tracking-tighter">{stats.avgResponseTime} min</p>
          <span className="text-[10px] text-slate-400 font-medium">Desde a solicitação até o aceite</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Navigation size={18} />
            <span className="text-[10px] font-black uppercase">Em Rota Agora</span>
          </div>
          <p className="text-3xl font-black italic uppercase tracking-tighter">{stats.statusCounts['EM_ROTA']}</p>
          <span className="text-[10px] text-slate-400 font-medium">Coletores ativos em trânsito</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertCircle size={18} />
            <span className="text-[10px] font-black uppercase">Alertas Atendimento</span>
          </div>
          <p className="text-3xl font-black italic uppercase tracking-tighter text-red-600">{stats.criticalCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Coletas pendentes &gt; 2h</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <CheckCircle size={18} />
            <span className="text-[10px] font-black uppercase">Taxa de Conclusão</span>
          </div>
          <p className="text-3xl font-black italic uppercase tracking-tighter text-emerald-600">{stats.completionRate}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Sucesso no ciclo de descarte</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8">Status das Coletas (Total)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
           <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Gargalos Geográficos</h3>
           <div className="space-y-4">
              {neighborhoodGargalos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:scale-[1.02] transition-transform">
                   <div>
                      <p className="text-sm font-black text-slate-800 uppercase italic">{item.neighborhood}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{item.pending} coletas pendentes</p>
                   </div>
                   <div className="text-right">
                      <p className={`text-xl font-black italic ${item.avgTime > 30 ? 'text-red-500' : 'text-slate-800'}`}>{item.avgTime}min</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tempo Médio</p>
                   </div>
                </div>
              ))}
              {neighborhoodGargalos.length === 0 && (
                <div className="text-center py-10 text-slate-300 italic font-medium uppercase text-xs">Nenhum dado geográfico disponível</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalView;
