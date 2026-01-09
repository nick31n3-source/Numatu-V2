
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Weight, ClipboardCheck, Building2, Users, Sparkles, Key, ShieldCheck, Leaf, BrainCircuit, RefreshCcw, Calendar, TrendingUp } from 'lucide-react';
import { CollectionData } from '../types';
import { GoogleGenAI } from "@google/genai";

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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'ALL'>('ALL');

  const filteredCollections = useMemo(() => {
    if (dateRange === 'ALL') return collections;
    const now = new Date();
    const days = parseInt(dateRange);
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return collections.filter(c => new Date(c.ts_solicitada) >= cutoff);
  }, [collections, dateRange]);

  const stats = useMemo(() => {
    const completed = filteredCollections.filter(c => c.status === 'CONCLUIDA');
    const totalKg = completed.reduce((acc, curr) => acc + (curr.weight_final || curr.weight), 0);
    const completedCount = completed.length;
    const activePartners = new Set(filteredCollections.map(c => c.id_anunciante)).size;
    const activeCollectors = new Set(filteredCollections.filter(c => c.id_coletor).map(c => c.id_coletor)).size;

    return { totalKg, completedCount, activePartners, activeCollectors };
  }, [filteredCollections]);

  // Fix: use the recommended content structure (Content[]) and safer response handling
  const generateAIInsight = async () => {
    if (filteredCollections.length === 0) {
      setAiInsight("Ainda não há dados suficientes no período selecionado para gerar insights.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise os dados de logística reversa da rede NUMATU (Últimos ${dateRange === 'ALL' ? 'registros totais' : dateRange + ' dias'}): Total de ${stats.totalKg.toFixed(1)}kg coletados em ${stats.completedCount} ciclos concluídos. Materiais processados: ${Array.from(new Set(filteredCollections.map(c => c.material))).join(', ')}. Como um estrategista de economia circular, dê uma recomendação de 1 parágrafo focada em otimização de rotas ou engajamento de empresas.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });
      setAiInsight(response.text || "Insight gerado com sucesso, mas retornou vazio.");
    } catch (err) {
      setAiInsight("A conexão com a Inteligência Artificial está oscilando. Tente novamente em instantes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const materialData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredCollections.filter(c => c.status === 'CONCLUIDA').forEach(c => {
      data[c.material] = (data[c.material] || 0) + (c.weight_final || c.weight);
    });
    return Object.keys(data).map(name => ({ name, value: data[name] }));
  }, [filteredCollections]);

  const conversionData = useMemo(() => {
    const total = filteredCollections.length;
    const aceitas = filteredCollections.filter(c => ['ACEITA', 'EM_ROTA', 'CONCLUIDA'].includes(c.status)).length;
    const concluidas = filteredCollections.filter(c => c.status === 'CONCLUIDA').length;
    return [
      { name: 'Solicitadas', count: total },
      { name: 'Engajadas', count: aceitas },
      { name: 'Validadas', count: concluidas },
    ];
  }, [filteredCollections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-brand-teal" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Análise Temporal</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          {(['7', '30', '90', 'ALL'] as const).map(opt => (
            <button 
              key={opt}
              onClick={() => setDateRange(opt)}
              className={`flex-1 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${dateRange === opt ? 'bg-brand-teal text-white shadow-lg' : 'text-slate-500 hover:text-brand-teal'}`}
            >
              {opt === 'ALL' ? 'TUDO' : opt + 'D'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brand-tealDark rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl">
        <div className="relative z-10 lg:max-w-xl">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md text-brand-green"><ShieldCheck size={20} /></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-brand-green/80">Infraestrutura em Nuvem Ativa</span>
          </div>
          <h2 className="text-4xl font-black mb-4 italic uppercase tracking-tighter">Visão Estratégica</h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                   <BrainCircuit size={18} className="text-brand-green" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Insights Gemini IA</span>
                </div>
                <button 
                  onClick={generateAIInsight} 
                  disabled={isGenerating}
                  className="p-2 bg-brand-green text-brand-tealDark rounded-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Atualizar análise"
                >
                   <RefreshCcw size={14} className={isGenerating ? 'animate-spin' : ''} />
                </button>
             </div>
             <p className="text-sm font-medium leading-relaxed italic opacity-90">
                {aiInsight || "Clique no botão de atualização para que o Gemini analise a performance operacional do período selecionado."}
             </p>
          </div>
        </div>
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-brand-green rounded-full blur-[120px] opacity-20"></div>
        <div className="relative z-10 grid grid-cols-2 gap-4 w-full lg:w-auto">
           <div className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/10 text-center">
              <Leaf size={24} className="mx-auto mb-2 text-brand-green" />
              <p className="text-2xl font-black italic tracking-tighter">100%</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-brand-green/70">Compliance</p>
           </div>
           <div className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/10 text-center">
              <TrendingUp size={24} className="mx-auto mb-2 text-brand-yellow" />
              <p className="text-2xl font-black italic tracking-tighter">On-Time</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-brand-yellow/70">Logística</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Peso Recuperado', value: `${stats.totalKg.toFixed(1)}kg`, sub: 'Material desviado', icon: Weight, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
          { label: 'Ciclos Validados', value: stats.completedCount.toString(), sub: 'Padrão Handshake', icon: Key, color: 'text-brand-green', bg: 'bg-brand-green/10' },
          { label: 'Rede Geradora', value: stats.activePartners.toString(), sub: 'Empresas Ativas', icon: Building2, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
          { label: 'Agentes Verdes', value: stats.activeCollectors.toString(), sub: 'Coletores Verificados', icon: Users, color: 'text-brand-tealDark', bg: 'bg-brand-tealDark/10' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-all border-b-4 hover:border-brand-teal group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}><kpi.icon size={28} /></div>
              <div className="text-brand-green text-[10px] font-black bg-brand-green/5 px-2 py-1 rounded-lg">LIVE</div>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{kpi.label}</h3>
            <p className="text-3xl font-black text-slate-800 my-1 italic uppercase tracking-tighter">{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-bold">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-slate-100"><TrendingUp size={120} /></div>
          <h3 className="text-xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter flex items-center gap-2 relative z-10">
            <Sparkles className="text-brand-yellow" /> Funil de Conversão
          </h3>
          <div className="h-[320px] relative z-10">
            {collections.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" fill="#2A8EAB" radius={[12, 12, 0, 0]} barSize={60}>
                     {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 2 ? '#8DC63F' : '#2A8EAB'} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 italic text-xs uppercase font-black">Aguardando dados...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter">Mix de Materiais</h3>
          <div className="h-[320px]">
            {materialData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={materialData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={80} 
                    outerRadius={110} 
                    paddingAngle={10} 
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {materialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[entry.name] || '#ccc'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle" 
                    wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 italic text-xs uppercase font-black">Sem coletas validadas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
