
import React from 'react';
import { Database, CheckCircle2, AlertTriangle, Terminal, Info, Share2 } from 'lucide-react';

const IntegrationView: React.FC = () => {
  const checklist = [
    { label: 'Chaves Primárias Únicas', status: true, desc: 'Toda coleta tem um ID único alfanumérico.' },
    { label: 'id_anunciante Presente', status: true, desc: 'Obrigatório para filtros de segurança por usuário.' },
    { label: 'Timestamps ISO 8601', status: true, desc: 'ts_solicitada e ts_aceita devem estar no formato UTC.' },
    { label: 'Geolocalização Padronizada', status: false, desc: 'Alguns registros sem lat/lng no módulo Anunciante.' },
    { label: 'Campos Calculados SLA', status: true, desc: 'Fórmula TTA configurada na fonte de dados.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Terminal className="text-slate-700" /> Pipeline do Anunciante
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Configure o filtro de "Endereço de E-mail do Visualizador" no Looker Studio para que cada anunciante veja apenas seus dados.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[120px]">
            <p className="text-2xl font-bold text-emerald-600">Secure</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Privacy Mode</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" /> Requisitos de Fonte de Dados
          </h3>
          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {item.status ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-amber-500" />}
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-2">SQL de SLA (Looker)</h3>
          <div className="space-y-4 font-mono text-[10px]">
            <div>
              <p className="text-emerald-400"># Diferença em Minutos</p>
              {/* Fix: changed ts_aceite to ts_aceita in SQL snippet documentation */}
              <p className="text-blue-300">DATETIME_DIFF(ts_aceita, ts_solicitada, MINUTE)</p>
            </div>
            <div className="mt-4">
              <p className="text-emerald-400"># Flag de Conversão</p>
              <p className="text-blue-300">CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationView;
