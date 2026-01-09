
import { Database, CheckCircle2, AlertTriangle, Terminal, Info, Share2, Copy, Check, Trash2, ShieldAlert, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { CollectionData } from '../types';
import { DatabaseService } from '../database';

interface IntegrationViewProps {
  collections: CollectionData[];
}

const IntegrationView: React.FC<IntegrationViewProps> = ({ collections }) => {
  const [copied, setCopied] = useState(false);
  const [nuclearCopied, setNuclearCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const sqlSchema = `
-- SETUP DEFINITIVO (PADRÃO SNAKE_CASE)
-- Execute este script no SQL Editor do Supabase para garantir compatibilidade total.

DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_profile_complete BOOLEAN DEFAULT false,
  face_verified BOOLEAN DEFAULT false,
  email_verificado BOOLEAN DEFAULT false,
  telefone_verificado BOOLEAN DEFAULT false,
  cpf_verificado BOOLEAN DEFAULT false,
  cnpj_verificado BOOLEAN DEFAULT false,
  endereco_verificado BOOLEAN DEFAULT false,
  foto_perfil_url TEXT,
  tipo_empresa TEXT,
  bio TEXT,
  cnpj TEXT,
  cpf TEXT,
  telefone TEXT,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  id_anunciante TEXT REFERENCES users(id),
  id_coletor TEXT REFERENCES users(id),
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
  company_name TEXT,
  company_avatar TEXT,
  foto_item_url TEXT,
  codigo_confirmacao TEXT,
  collector_name TEXT,
  ts_solicitada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ts_aceita TIMESTAMP WITH TIME ZONE,
  ts_em_rota TIMESTAMP WITH TIME ZONE,
  ts_concluida TIMESTAMP WITH TIME ZONE,
  ts_cancelada TIMESTAMP WITH TIME ZONE,
  ts_expiracao TIMESTAMP WITH TIME ZONE,
  prioridade TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
`.trim();

  const nuclearResetSql = `
-- COMANDO DE RESET TOTAL (NUCLEAR)
TRUNCATE TABLE collections CASCADE;
TRUNCATE TABLE users CASCADE;
`.trim();

  const handleCopy = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleLocalReset = async () => {
    if (confirm("ATENÇÃO: Isso apagará todos os dados do LocalStorage e deslogará você. Continuar?")) {
      setIsResetting(true);
      setTimeout(() => {
        DatabaseService.clearAllData();
      }, 1500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 mb-2 flex items-center gap-2">
            <Terminal className="text-slate-700" /> Pipeline de Dados
          </h2>
          <p className="text-slate-500 leading-relaxed font-medium text-sm">
            Execute o script SQL inicial para configurar a estrutura de dados no Supabase.
          </p>
        </div>
        <button 
          onClick={() => handleCopy(sqlSchema, setCopied)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-brand-blue transition-all shadow-lg active:scale-95"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          Copiar SQL Setup
        </button>
      </div>

      <div className="bg-slate-900 text-slate-300 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          <pre className="text-blue-300 font-mono text-[10px] leading-relaxed overflow-x-auto">
            {sqlSchema}
          </pre>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
            <ShieldAlert className="text-red-500" size={24} />
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-red-600">Danger Zone (Reset para Testes)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] space-y-6">
                <div>
                    <h4 className="font-black uppercase italic text-red-900 text-sm">Reset do Banco (Nuvem)</h4>
                    <p className="text-xs text-red-700/70 font-medium mt-1">Copie o comando abaixo e execute no SQL Editor do Supabase para zerar as tabelas.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl text-red-400 font-mono text-[10px]">
                    {nuclearResetSql}
                </div>
                <button 
                  onClick={() => handleCopy(nuclearResetSql, setNuclearCopied)}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
                >
                  {nuclearCopied ? <Check size={14} /> : <Copy size={14} />} Copiar Reset SQL
                </button>
            </div>

            <div className="bg-slate-100 border border-slate-200 p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                <div>
                    <h4 className="font-black uppercase italic text-slate-800 text-sm">Reset de Cache (Local)</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Apaga usuários e coletas salvos no seu navegador e limpa a sessão ativa.</p>
                </div>
                <div className="py-10 text-center">
                    {isResetting ? <RefreshCw size={48} className="text-brand-blue animate-spin mx-auto" /> : <Trash2 size={48} className="text-slate-300 mx-auto" />}
                </div>
                <button 
                  onClick={handleLocalReset}
                  disabled={isResetting}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                >
                  {isResetting ? "Limpando..." : <><Trash2 size={14} /> Limpar Cache Local</>}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationView;
