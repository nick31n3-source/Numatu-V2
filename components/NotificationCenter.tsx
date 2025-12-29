
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Info, CheckCircle2, AlertTriangle, MessageSquare, Truck, Package, ShieldCheck, Activity } from 'lucide-react';
import { User, CollectionData } from '../types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  ts: Date;
  read: boolean;
}

interface NotificationCenterProps {
  user: User;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<'OK' | 'TESTING'>('OK');

  const processChange = useCallback((data: CollectionData) => {
    let newNotif: Notification | null = null;
    const transientData = data as any;

    // LÓGICA DE DESTINATÁRIO CRUZADO (CROSS-USER HANDSHAKE)
    
    // 1. COLETOR DESISTIU -> Anunciante recebe
    if (data.status === 'ANUNCIADA' && transientData._abandoned && user.role === 'ADVERTISER' && data.id_anunciante === user.id) {
      newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Coleta Abandonada',
        message: `O coletor desistiu da retirada de ${data.material}. Sua carga voltou ao marketplace.`,
        type: 'WARNING',
        ts: new Date(),
        read: false
      };
    }
    
    // 2. ANUNCIANTE PUBLICOU -> Coletor recebe (se não for ele o autor)
    else if (data.status === 'ANUNCIADA' && !transientData._abandoned && user.role === 'COLLECTOR') {
      newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Nova Oportunidade',
        message: `Material de ${data.material} disponível em ${data.neighborhood}.`,
        type: 'INFO',
        ts: new Date(),
        read: false
      };
    } 
    
    // 3. COLETOR ACEITOU -> Anunciante recebe
    else if (data.status === 'ACEITA' && user.role === 'ADVERTISER' && data.id_anunciante === user.id) {
      newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Carga Aceita!',
        message: `Um coletor confirmou a retirada do material (${data.material}).`,
        type: 'SUCCESS',
        ts: new Date(),
        read: false
      };
    }

    // 4. COLETOR CHEGOU -> Anunciante recebe
    else if (data.status === 'EM_COLETA' && user.role === 'ADVERTISER' && data.id_anunciante === user.id) {
      newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Coletor no Local',
        message: `O parceiro chegou ao endereço. Forneça o código: ${data.codigo_confirmacao || '---'}.`,
        type: 'WARNING',
        ts: new Date(),
        read: false
      };
    }

    // 5. CONCLUÍDA -> Coletor recebe
    else if (data.status === 'CONCLUIDA' && user.role === 'COLLECTOR' && data.id_coletor === user.id) {
      newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Ciclo Finalizado',
        message: `Coleta de ${data.material} validada pelo anunciante.`,
        type: 'SUCCESS',
        ts: new Date(),
        read: false
      };
    }

    if (newNotif) {
      setNotifications(prev => [newNotif!, ...prev].slice(0, 10));
    }
  }, [user.id, user.role]);

  useEffect(() => {
    // Escuta eventos na mesma aba
    const handleLocalChange = (e: any) => {
      setIntegrityStatus('TESTING');
      processChange(e.detail.data);
      setTimeout(() => setIntegrityStatus('OK'), 800);
    };

    // Escuta mudanças vindas de OUTRAS abas (Simula multiusuário na Hostinger/Vercel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'numatu_collections_v5' && e.newValue) {
        try {
          const collections: CollectionData[] = JSON.parse(e.newValue);
          // Pega a alteração mais recente
          const latest = collections.sort((a, b) => 
            new Date(b.ts_solicitada).getTime() - new Date(a.ts_solicitada).getTime()
          )[0];
          if (latest) processChange(latest);
        } catch (err) {
          console.error("Erro ao sincronizar abas");
        }
      }
    };

    window.addEventListener('numatu_data_change', handleLocalChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('numatu_data_change', handleLocalChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [processChange]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* INDICADOR DE VERIFICAÇÃO DE CÓDIGO/SISTEMA */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
          integrityStatus === 'OK' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse'
        }`}>
          {integrityStatus === 'OK' ? <ShieldCheck size={12} /> : <Activity size={12} className="animate-spin" />}
          <span className="text-[8px] font-black uppercase tracking-widest">
            {integrityStatus === 'OK' ? 'Sincronizado' : 'Verificando...'}
          </span>
        </div>

        <button 
          onClick={() => { setIsOpen(!isOpen); setNotifications(prev => prev.map(n => ({...n, read: true}))); }}
          className="relative p-2.5 bg-slate-100 rounded-2xl text-slate-500 hover:text-brand-teal transition-all group active:scale-95"
        >
          <Bell size={20} className={unreadCount > 0 ? 'animate-ring text-brand-teal' : ''} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-green text-brand-tealDark text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">Notificações Cruzadas</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Audit Log em Tempo Real</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
            </div>
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-white">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.id} className={`p-5 border-b border-slate-50 flex gap-4 transition-all hover:bg-slate-50`}>
                    <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                      n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                      n.type === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-brand-teal/10 text-brand-teal'
                    }`}>
                      {n.type === 'SUCCESS' ? <CheckCircle2 size={18} /> : 
                       n.type === 'WARNING' ? <AlertTriangle size={18} /> : 
                       <Package size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-800 leading-tight mb-1">{n.title}</p>
                      <p className="text-[9px] font-medium text-slate-500 leading-relaxed">{n.message}</p>
                      <p className="text-[7px] font-black text-slate-300 uppercase mt-2 tracking-widest">Via Handshake v5</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                      <MessageSquare className="text-slate-200" size={24} />
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Sem notificações para sua função</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
