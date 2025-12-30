
import React from 'react';
import { Lightbulb, Layout, MapPin, Database, Target, Star, GitMerge, Layers, BarChart3, LineChart, ShieldCheck } from 'lucide-react';

const AdvicePanel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="bg-gradient-to-br from-brand-tealDark to-slate-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-brand-green/30 text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 inline-block border border-brand-green/20">Guia de BI Profissional</span>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Dashboard Design Pro</h2>
          <p className="text-slate-300 text-lg opacity-90 leading-relaxed max-w-2xl font-medium italic">
            Como transformar as tabelas do Supabase em visualizações de impacto no Google Looker Studio.
          </p>
        </div>
        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl"></div>
      </div>

      {/* Looker Studio Cheat Sheet */}
      <section className="space-y-6">
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-3">
          <BarChart3 className="text-brand-teal" />
          Looker Studio Cheat Sheet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><LineChart size={20} /></div>
                <h4 className="font-black uppercase italic text-sm text-slate-800">Cálculo de Eficiência</h4>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fórmula Campo Calculado:</p>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] mb-4">
              COUNT(CASE WHEN status = 'CONCLUIDA' THEN id END) / COUNT(id)
            </div>
            <p className="text-xs text-slate-500 font-medium">Use este campo em um gráfico de "Visão Geral" para medir a saúde da sua operação.</p>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><MapPin size={20} /></div>
                <h4 className="font-black uppercase italic text-sm text-slate-800">Mapas de Calor</h4>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dica de Dimensão:</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No Looker Studio, altere o tipo de campo de <strong>lat</strong> e <strong>lng</strong> para "Geográfico". Isso permite criar mapas de bolhas onde o tamanho da bolha é a métrica <strong>weight</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Relacionamentos */}
      <section className="space-y-6">
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-3">
          <GitMerge className="text-brand-green" />
          Relacionamentos PostgreSQL
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Empresa → Coletas', rel: '1:N', desc: 'Um gerador, múltiplos pedidos.' },
            { label: 'Coletor → Coletas', rel: '1:N', desc: 'Um agente, várias missões.' },
            { label: 'Status → Time', rel: 'Funil', desc: 'O tempo entre cada mudança de status.' },
            { label: 'Usuário → Roles', rel: 'Permissão', desc: 'Define o que cada perfil acessa.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-lg font-black italic text-slate-800 leading-none">{item.rel}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dica Final */}
      <div className="bg-brand-tealDark p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="p-5 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 shrink-0">
            <Star className="text-brand-yellow w-12 h-12 fill-brand-yellow" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">Padrão de Cores NUMATU</h4>
          <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
            Para um dashboard profissional, use a paleta: <br/>
            <span className="text-brand-teal">#2A8EAB (Primária)</span> • 
            <span className="text-brand-green"> #8DC63F (Sustentabilidade)</span> • 
            <span className="text-brand-yellow"> #FFD100 (Alertas)</span>. <br/>
            Isso cria uma conexão visual imediata entre este app e os seus relatórios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvicePanel;
