
import React from 'react';
import { ShieldCheck, Timer, AlertTriangle, Trophy, Code } from 'lucide-react';

const BusinessRulesView: React.FC = () => {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" /> Regras e Métricas Looker Studio
        </h2>
        <p className="text-slate-500">Definição lógica para transformações de dados (ETL) e campos calculados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lógica de Negócio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Timer className="text-blue-600" /> Gatilhos de Alerta
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-red-500">
              <p className="text-sm font-bold text-slate-800">Coleta Atrasada (SLA)</p>
              <p className="text-xs text-slate-500 mt-1">
                Se <code>(HOJE - ts_solicitada) &gt; 24h</code> e <code>status == 'SOLICITADA'</code>.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-amber-500">
              <p className="text-sm font-bold text-slate-800">Empresa Inativa</p>
              <p className="text-xs text-slate-500 mt-1">
                Se <code>(HOJE - MAX(ts_solicitada)) &gt; 15 dias</code>.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-500">
              <p className="text-sm font-bold text-slate-800">Nível do Coletor (Gamificação)</p>
              <ul className="text-[10px] text-slate-500 mt-1 space-y-1">
                <li>• <strong>OURO:</strong> Concluídas &gt; 50 e Cancelamento &lt; 5%</li>
                <li>• <strong>PRATA:</strong> Concluídas entre 20 e 50</li>
                <li>• <strong>BRONZE:</strong> Início de operação</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Campos Calculados */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Code className="text-purple-600" /> Fórmulas Looker Studio
          </h3>
          <div className="space-y-4">
            <div className="group">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lead Time Aceite (TTA)</p>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px]">
                {/* Fix: changed ts_aceite to ts_aceita in formula documentation */}
                DATEDIFF(ts_aceita, ts_solicitada, SECOND) / 60
              </div>
            </div>
            <div className="group">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Taxa de Conversão</p>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px]">
                COUNT(id_concluida) / COUNT(id_solicitada)
              </div>
            </div>
            <div className="group">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Peso Médio por Visita</p>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px]">
                SUM(peso_kg) / COUNT(id_coleta)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dica */}
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
        <Trophy className="text-emerald-600 w-8 h-8 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-emerald-900 mb-1">Métricas de Engajamento</h4>
          <p className="text-emerald-800 text-sm leading-relaxed">
            Métricas como recorrência e LTV ajudam a entender a saúde da rede logística. No Looker Studio, use "Campos Calculados" na fonte de dados para padronizar estas regras.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRulesView;
