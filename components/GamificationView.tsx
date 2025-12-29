
import React from 'react';
import { Award, TrendingUp, Star, Zap, ShieldCheck } from 'lucide-react';

const GamificationView: React.FC = () => {
  const partners = [
    { name: 'Mercado Central', type: 'Empresa', level: 'Floresta', progress: 85, icon: '🌳', color: 'text-emerald-600' },
    { name: 'Condomínio Bela Vista', type: 'Empresa', level: 'Broto', progress: 45, icon: '🌿', color: 'text-blue-600' },
    { name: 'João Silva', type: 'Coletor', level: 'Ouro', progress: 98, icon: '🥇', color: 'text-amber-500' },
    { name: 'Maria Santos', type: 'Coletor', level: 'Prata', progress: 72, icon: '🥈', color: 'text-slate-400' },
    { name: 'Papelaria ABC', type: 'Empresa', level: 'Semente', progress: 20, icon: '🌱', color: 'text-amber-700' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Guia de Níveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Zap size={16} className="text-blue-500" /> Jornada da Empresa
          </h3>
          <div className="flex justify-between items-center px-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-2xl mb-2 opacity-50">🌱</div>
              <p className="text-[10px] font-bold">Semente</p>
            </div>
            <div className="h-[2px] bg-slate-100 flex-1 mx-2 mb-6"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-2">🌿</div>
              <p className="text-[10px] font-bold">Broto</p>
            </div>
            <div className="h-[2px] bg-slate-100 flex-1 mx-2 mb-6"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mb-2">🌳</div>
              <p className="text-[10px] font-bold">Floresta</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-6 text-center italic">"Níveis baseados no peso total reciclado nos últimos 30 dias"</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> Confiança do Coletor
          </h3>
          <div className="flex justify-between items-center px-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-2 opacity-50">🥉</div>
              <p className="text-[10px] font-bold">Bronze</p>
            </div>
            <div className="h-[2px] bg-slate-100 flex-1 mx-2 mb-6"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-2">🥈</div>
              <p className="text-[10px] font-bold">Prata</p>
            </div>
            <div className="h-[2px] bg-slate-100 flex-1 mx-2 mb-6"></div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-2xl mb-2">🥇</div>
              <p className="text-[10px] font-bold">Ouro</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-6 text-center italic">"Baseado na taxa de conclusão de coletas e avaliação das empresas"</p>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-emerald-600" /> Mural de Destaques
          </h3>
          <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">Ver Todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Parceiro</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Nível Atual</th>
                <th className="px-6 py-4">Progresso Próximo Nível</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partners.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-medium bg-slate-100 px-2 py-1 rounded-md">{p.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 font-bold ${p.color}`}>
                      <span className="text-lg">{p.icon}</span> {p.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[120px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.color.replace('text', 'bg')}`} style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto">
                      <Star size={12} fill="currentColor" /> Reconhecer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Motivational Quotes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          "\"Pequenas coletas geram grandes florestas.\"",
          "\"A logística reversa é o coração da economia circular.\"",
          "\"Sua eficiência hoje poupa o amanhã.\""
        ].map((quote, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-500 text-sm text-center">
            {quote}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamificationView;
