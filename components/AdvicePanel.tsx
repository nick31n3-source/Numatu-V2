
import React from 'react';
import { Lightbulb, Layout, MapPin, Database, Target, Star, GitMerge, Layers } from 'lucide-react';

const AdvicePanel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-10 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Arquiteto de Dados</span>
          <h2 className="text-4xl font-extrabold mb-4">Modelagem NUMATU</h2>
          <p className="text-emerald-50 text-xl opacity-90 leading-relaxed max-w-2xl">
            Como organizar suas tabelas para que o Looker Studio gere insights automáticos e rápidos.
          </p>
        </div>
        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Relacionamentos */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <GitMerge className="text-emerald-600" />
          Dicionário de Relacionamentos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Empresa → Coletas (1:N)</p>
            <p className="text-xs text-slate-500 italic">"Cada ponto de geração pode solicitar infinitas coletas ao longo do tempo."</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Coletor → Coletas (1:N)</p>
            <p className="text-xs text-slate-500 italic">"O coletor é o executor da transação vinculada pelo ID."</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Coleta → Materiais (1:N)</p>
            <p className="text-xs text-slate-500 italic">"Importante separar itens para não duplicar o peso total da coleta principal."</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Usuário → Perfil (1:1)</p>
            <p className="text-xs text-slate-500 italic">"A conta de acesso define se o usuário vê a visão de Empresa ou Coletor."</p>
          </div>
        </div>
      </section>

      {/* MVP Strategy */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Layers className="text-blue-600" />
          Estratégia de MVP (Simplificação)
        </h3>
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl">
          <h4 className="font-bold text-blue-900 mb-4">Versão de Planilha Única (Flat Table)</h4>
          <p className="text-blue-800 text-sm mb-6 leading-relaxed">
            Se você estiver começando apenas com Google Sheets e quiser rapidez, pode fundir tudo em uma única <strong>"Grande Tabela de Coletas"</strong>. Cada linha representa um material coletado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-blue-600 uppercase">Essencial</span>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>• Data da Coleta</li>
                <li>• Bairro/Cidade</li>
                <li>• Nome da Empresa</li>
                <li>• Peso (kg)</li>
                <li>• Tipo de Material</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Segunda Fase</span>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                <li>• Nome do Coletor</li>
                <li>• Tempo de Atendimento</li>
                <li>• Avaliação (Estrelas)</li>
                <li>• Distância Percorrida</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dica Final */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
        <Star className="text-amber-500 w-8 h-8 flex-shrink-0 fill-current" />
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Métricas vs Dimensões</h4>
          <p className="text-amber-800 text-sm leading-relaxed">
            No Looker Studio, campos como <strong>Peso</strong> e <strong>Tempo</strong> devem ser configurados como "Métricas" (Agregação: Soma ou Média). Campos como <strong>Status</strong> e <strong>Bairro</strong> são "Dimensões". Nunca misture as categorias na fonte de dados!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvicePanel;
