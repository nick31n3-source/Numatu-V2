
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Weight, ClipboardCheck, Building2, Users, Sparkles, Key, ShieldCheck, Leaf } from 'lucide-react';
import { CollectionData } from '../types';

interface DashboardProps {
  collections: CollectionData[];
}

const BRAND_COLORS: Record<string, string> = {
  'Papel': '#2A8EAB',
  'Plástico': '#8DC63F',
  'Vidro': '#76B82D',
  'Metal': '#FFD100',
  'Orgânico': '#1D6B82',
  'Eletrônicos': '#10b981',
  'Outros': '#94a3b8'
};

const DashboardView: React.FC<DashboardProps> = ({ collections }) => {
  const stats = useMemo(() => {
    const totalKg = collections.filter(c => c.status === 'CONCLUIDA').reduce((acc, curr) => acc + curr.weight, 0);
    const completedCount = collections.filter(c => c.status === 'CONCLUIDA').length;
    const activePartners = new Set(collections.map(c => c.id_anunciante)).size;
    const activeCollectors = new Set(collections.filter(c => c.id_coletor).map(c => c.id_coletor)).size;

    return { totalKg, completedCount, activePartners, activeCollectors };
  }, [collections]);

  const materialData = useMemo(() => {
    const data: Record<string, number> = {};
    collections.filter(c => c.status === 'CONCLUIDA').forEach(c => {
      data[c.material] = (data[c.material] || 0) + c.weight;
    });
    return Object.keys(data).map(name => ({ name, value: data[name] }));
  }, [collections]);

  const conversionData = useMemo(() => {
    const total = collections.length;
    const aceitas = collections.filter(c => ['ACEITA', 'EM_ROTA', 'CONCLUIDA'].includes(c.status)).length;
    const concluidas = collections.filter(c => c.status === 'CONCLUIDA').length;
    return [
      { name: 'Solicitadas', count: total },
      { name: 'Em Rota', count: aceitas },
      { name: 'Concluídas', count: concluidas },
    ];
  }, [collections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-brand-tealDark rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md text-brand-green"><ShieldCheck size={24} /></div>
             <span className="text-xs font-black uppercase tracking-widest text-brand-green/80">Segurança de Dados Ativa</span>
          </div>
          <h2 className="text-4xl font-black mb-2 flex items-center gap-2 italic uppercase tracking-tighter">Impacto Permanente</h2>
          <p className="opacity-90 max-w-lg text-lg leading-tight font-medium">Validando cada transação via Handshake Digital para garantir zero fraude na logística reversa.</p>
        </div>
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-brand-green rounded-full blur-[120px] opacity-20"></div>
        <div className="relative z-10 bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/10 text-center min-w-[200px]">
           <Leaf size={32} className="mx-auto mb-2 text-brand-green" />
           <p className="text-3xl font-black italic tracking-tighter">100%</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-brand-green">Sustentabilidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Peso Recuperado', value: `${stats.totalKg}kg`, sub: 'Material desviado', icon: Weight, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
          { label: 'Ciclos Validados', value: stats.completedCount.toString(), sub: 'Via Handshake', icon: Key, color: 'text-brand-green', bg: 'bg-brand-green/10' },
          { label: 'Empresas Ativas', value: stats.activePartners.toString(), sub: 'Geradores Verificados', icon: Building2, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
          { label: 'Agentes Verdes', value: stats.activeCollectors.toString(), sub: 'Em operação', icon: Users, color: 'text-brand-tealDark', bg: 'bg-brand-tealDark/10' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} shadow-inner`}><kpi.icon size={28} /></div>
              <div className="text-brand-green text-[10px] font-black bg-brand-green/5 px-2 py-1 rounded-lg">LIVE</div>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{kpi.label}</h3>
            <p className="text-3xl font-black text-slate-800 my-1 italic uppercase tracking-tighter">{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-bold">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter flex items-center gap-2">
            <Sparkles className="text-brand-yellow" /> Funil de Eficiência
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#2A8EAB" radius={[12, 12, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter">Mix de Recuperação</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={materialData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[entry.name] || '#ccc'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: 900}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
