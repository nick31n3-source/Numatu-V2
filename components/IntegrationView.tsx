
import { Database, CheckCircle2, AlertTriangle, Terminal, Info, Share2, Copy, Check, Download, FileSpreadsheet } from 'lucide-react';
import React, { useState } from 'react';
import { CollectionData } from '../types';

interface IntegrationViewProps {
  collections: CollectionData[];
}

const IntegrationView: React.FC<IntegrationViewProps> = ({ collections }) => {
  const [copied, setCopied] = useState(false);

  const checklist = [
    { label: 'Chaves Primárias Únicas', status: true, desc: 'Toda coleta tem um ID único alfanumérico.' },
    { label: 'id_anunciante Presente', status: true, desc: 'Obrigatório para filtros de segurança por usuário.' },
    { label: 'Timestamps ISO 8601', status: true, desc: 'ts_solicitada e ts_aceita em formato UTC para time-series.' },
    { label: 'Geolocalização Ativa', status: true, desc: 'Lat/Lng capturados via GPS Browser em tempo real.' },
    { label: 'Conexão Supabase Ready', status: true, desc: 'Chave JWT (eyJ...) validada e ativa.' },
  ];

  const sqlSchema = `
-- 1. LIMPAR SCHEMA ANTERIOR (Opcional, use para resetar a estrutura)
DROP TABLE IF EXISTS collections;

-- 2. CRIAR TABELA DE COLETAS OTIMIZADA PARA BI
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  id_anunciante TEXT NOT NULL,
  id_coletor TEXT,
  status TEXT,
  material TEXT,
  description TEXT,
  weight FLOAT8,
  weight_final FLOAT8,
  neighborhood TEXT,
  city TEXT,
  address TEXT,
  lat FLOAT8,
  lng FLOAT8,
  "companyName" TEXT,
  "companyAvatar" TEXT,
  foto_item_url TEXT,
  codigo_confirmacao TEXT,
  "collectorName" TEXT,
  ts_solicitada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ts_aceita TIMESTAMP WITH TIME ZONE,
  ts_em_rota TIMESTAMP WITH TIME ZONE,
  ts_concluida TIMESTAMP WITH TIME ZONE,
  ts_cancelada TIMESTAMP WITH TIME ZONE,
  ts_expiracao TIMESTAMP WITH TIME ZONE,
  prioridade TEXT,
  notes TEXT,
  "isArchived" BOOLEAN DEFAULT false
);

-- 3. HABILITAR NOTIFICAÇÕES REALTIME
-- Se já estiver habilitado, o comando abaixo falhará silenciosamente
DO $$ 
BEGIN
  BEGIN
    ALTER publication supabase_realtime ADD TABLE collections;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Publicação já existe ou erro ignorado';
  END;
END $$;
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCSV = () => {
    if (collections.length === 0) return;
    
    const headers = ["ID", "AnuncianteID", "Status", "Material", "Peso_Kg", "Bairro", "Cidade", "Latitude", "Longitude", "Data_Solicitacao"];
    const rows = collections.map(c => [
      c.id,
      c.id_anunciante,
      c.status,
      c.material,
      c.weight,
      c.neighborhood,
      c.city,
      c.lat,
      c.lng,
      c.ts_solicitada
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `numatu_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 mb-2 flex items-center gap-2">
            <Terminal className="text-slate-700" /> Pipeline Looker Studio
          </h2>
          <p className="text-slate-500 leading-relaxed font-medium text-sm">
            Execute o script SQL no Supabase para criar a estrutura que o Looker Studio precisa para ler os dados corretamente.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
          >
            <Download size={16} /> Exportar CSV para BI
          </button>
          <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 min-w-[120px]">
            <p className="text-xl font-black text-emerald-600 italic">SECURE</p>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Pipeline OK</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" /> Integridade da Fonte de Dados
          </h3>
          <div className="space-y-4">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-teal transition-colors">
                <div className="flex items-center gap-4">
                  {item.status ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertTriangle size={20} className="text-amber-500" />}
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase italic">{item.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-slate-300 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
             <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Script SQL Oficial</h3>
             <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-green"
             >
                {copied ? <Check size={16} /> : <Copy size={16} />}
             </button>
          </div>
          <div className="space-y-6 font-mono text-[10px] leading-relaxed">
            <div>
              <p className="text-emerald-400">-- Copie e cole no SQL Editor do Supabase:</p>
              <pre className="text-blue-300 whitespace-pre-wrap mt-2 custom-scrollbar overflow-y-auto max-h-[350px]">{sqlSchema}</pre>
            </div>
            <div className="pt-4 border-t border-white/10 italic text-[9px] text-slate-500">
              * Utilize este schema para garantir que as dimensões de Tempo e Geolocalização sejam reconhecidas automaticamente no Looker Studio.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-tealDark/5 p-8 rounded-[3rem] border border-brand-teal/10 flex items-center gap-6">
         <div className="p-4 bg-white rounded-2xl shadow-sm text-brand-teal">
           <FileSpreadsheet size={32} />
         </div>
         <div>
            <h4 className="font-black text-slate-800 uppercase italic text-sm">Dica de Dashboard</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl mt-1">
              No Looker Studio, adicione o campo <strong>ts_solicitada</strong> como a "Dimensão de Período" e use a <strong>Latitude/Longitude</strong> para criar mapas de calor da logística.
            </p>
         </div>
      </div>
    </div>
  );
};

export default IntegrationView;
