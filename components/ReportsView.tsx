
import React, { useState } from 'react';
import { Mail, Send, Calendar, CheckCircle, RefreshCcw, FileText, Settings, ShieldCheck, MailCheck, AlertCircle } from 'lucide-react';
import { CollectionData } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ReportsViewProps {
  collections: CollectionData[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ collections }) => {
  const [isSending, setIsSending] = useState(false);
  const [reportLog, setReportLog] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!process.env.API_KEY) {
      setError("Sistema em modo offline: API Key não configurada.");
      return;
    }

    setIsSending(true);
    setSentSuccess(false);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const summaryData = collections.slice(0, 20).map(c => ({
        material: c.material,
        peso: c.weight,
        status: c.status,
        bairro: c.neighborhood
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere um relatório executivo operacional para o sistema NUMATU. 
        Dados: ${JSON.stringify(summaryData)}. 
        Relate métricas totais, performance por bairro e uma mensagem motivacional sobre preservação ambiental. 
        Responda em Português do Brasil de forma estruturada.`,
      });

      const reportText = response.text || "Conteúdo não gerado.";
      setReportLog(reportText);
      setSentSuccess(true);
      
    } catch (error) {
      console.error("Erro no relatório:", error);
      setError("Houve um erro ao processar o relatório via IA.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-brand-teal text-white rounded-[2rem] shadow-xl shadow-brand-teal/20">
              <Mail size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">Reports Automatizados</h2>
              <p className="text-slate-500 text-sm mt-1">Sincronização diária de performance para parceiros.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-brand-green/10 px-5 py-3 rounded-2xl border border-brand-green/20">
             <ShieldCheck size={18} className="text-brand-green" />
             <span className="text-[10px] font-black uppercase text-brand-greenDark tracking-widest">Pipeline Ativo</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-4 text-xs font-bold animate-in bounce">
            <AlertCircle size={24} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stakeholder Principal</label>
                <Settings size={14} className="text-slate-300" />
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <MailCheck className="text-brand-teal" size={20} />
                <span className="font-black text-slate-700 italic">operacional@numatu.app</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">Monitoramento contínuo de KPIs via Gemini Flash Pro.</p>
            </div>

            <div className="space-y-4">
               <button 
                 onClick={generateReport}
                 disabled={isSending}
                 className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-brand-teal transition-all shadow-xl active:scale-95 disabled:opacity-50"
               >
                 {isSending ? <RefreshCcw size={20} className="animate-spin" /> : <Send size={20} />}
                 {isSending ? 'Consolidando Database...' : 'Gerar Snapshot de Hoje'}
               </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-slate-300 relative overflow-hidden min-h-[400px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl"></div>
             <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-brand-green" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Console Log IA</span>
                </div>
                {sentSuccess && <span className="text-[9px] font-black uppercase bg-brand-green text-brand-tealDark px-3 py-1 rounded-full animate-in zoom-in">Pronto ✓</span>}
             </div>
             
             {reportLog ? (
               <div className="prose prose-invert prose-sm max-w-none animate-in fade-in slide-in-from-bottom-2 custom-scrollbar overflow-y-auto max-h-[300px]">
                 <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed opacity-90 italic">
                   {reportLog}
                 </pre>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-64 opacity-20 text-center space-y-4">
                  <Calendar size={64} />
                  <p className="text-xs font-bold uppercase tracking-widest italic tracking-tighter">Aguardando gatilho manual ou agendado</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
