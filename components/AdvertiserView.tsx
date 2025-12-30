
import React, { useState, useMemo, useRef } from 'react';
import { Megaphone, Plus, X, MapPin, CheckCircle2, Camera, ShieldCheck, ImageIcon, RefreshCw, Locate, ArrowRight, Sparkles, Package, Trash2 } from 'lucide-react';
import { User, CollectionData, MaterialType } from '../types';
import { MATERIAL_PLACEHOLDERS, MATERIAL_COLORS } from '../constants';

interface AdvertiserViewProps {
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
  onAdd: (col: CollectionData) => void;
  onUpdateUser: (updatedUser: User) => void;
  // Added missing onLogout prop
  onLogout: () => void;
}

const AdvertiserView: React.FC<AdvertiserViewProps> = ({ user, collections, onUpdate, onAdd, onUpdateUser, onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ADS' | 'PROFILE'>('ADS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmingCodeId, setConfirmingCodeId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  
  // Estados do Novo Fluxo Rápido
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  const myCollections = useMemo(() => 
    collections.filter(c => c.id_anunciante === user.id),
  [collections, user.id]);

  const handleStartFlow = (material: MaterialType) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
    // Tenta pegar a localização em background assim que o fluxo começa
    if (!coords) handleGetLocation();
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setCoords({ lat: -23.5505, lng: -46.6333 });
        setIsLocating(false);
      },
      { timeout: 5000 }
    );
  };

  const processAndSetImage = async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      await img.decode();
      const canvas = document.createElement('canvas');
      const MAX_DIM = 500;
      let width = img.width, height = img.height;
      if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
      else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        setNewItemImage(canvas.toDataURL('image/jpeg', 0.6));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const weight = Number(formData.get('weight')) || 1;
    
    const finalImage = (newItemImage && newItemImage.length > 200) 
      ? newItemImage 
      : (MATERIAL_PLACEHOLDERS[selectedMaterial!] || MATERIAL_PLACEHOLDERS['Outros']);

    const newAnuncio: CollectionData = {
      id: `COL-${Date.now()}`,
      id_anunciante: user.id,
      status: 'ANUNCIADA',
      material: selectedMaterial!,
      weight,
      city: user.cidade || 'São Paulo',
      neighborhood: user.bairro || 'Centro',
      address: user.rua ? `${user.rua}, ${user.numero}` : 'Endereço não informado',
      lat: coords?.lat || -23.5505,
      lng: coords?.lng || -46.6333,
      companyName: user.nome_publico || user.name,
      companyAvatar: user.foto_perfil_url || '',
      foto_item_url: finalImage,
      ts_solicitada: new Date().toISOString(),
      prioridade: 'Média',
    };
    
    onAdd(newAnuncio);
    setIsModalOpen(false);
    setSelectedMaterial(null);
    setNewItemImage(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Tab Selector */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit mx-auto md:mx-0 shadow-inner">
        <button onClick={() => setActiveSubTab('ADS')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'ADS' ? 'bg-white text-brand-teal shadow-md scale-105' : 'text-slate-500 hover:text-brand-teal'}`}>Cargas e Descartes</button>
        <button onClick={() => setActiveSubTab('PROFILE')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'PROFILE' ? 'bg-white text-brand-teal shadow-md scale-105' : 'text-slate-500 hover:text-brand-teal'}`}>Configurações</button>
      </div>

      {activeSubTab === 'ADS' ? (
        <div className="space-y-10">
          {/* Quick Start Categories - O NOVO FLUXO IFOOD */}
          <section className="space-y-6">
            <div className="flex items-end justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">O que vamos descartar?</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Toque em uma categoria para começar</p>
                </div>
                <div className="hidden md:block bg-brand-green/10 text-brand-greenDark px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-brand-green/20 animate-pulse">
                    Rede Ativa: 12 Coletores Próximos
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico', 'Outros'] as MaterialType[]).map(mat => (
                <button 
                  key={mat} 
                  onClick={() => handleStartFlow(mat)}
                  className="group relative h-40 rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-brand-teal hover:scale-[1.03] transition-all shadow-sm hover:shadow-xl active:scale-95"
                >
                  <img src={MATERIAL_PLACEHOLDERS[mat]} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                  <div className="absolute bottom-6 inset-x-0 text-center">
                    <p className="text-white font-black uppercase italic text-xs tracking-tighter mb-1">{mat}</p>
                    <div className="w-6 h-1 bg-brand-green mx-auto rounded-full group-hover:w-12 transition-all"></div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Ativos Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Package className="text-brand-teal" size={20} />
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-800">Anúncios em Aberto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCollections.length > 0 ? myCollections.map(c => (
                <div key={c.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
                   {/* Status Badge Superior */}
                  <div className={`absolute top-4 right-4 z-10 px-4 py-1.5 rounded-full text-[8px] font-black uppercase shadow-xl backdrop-blur-md border ${
                    c.status === 'CONCLUIDA' ? 'bg-emerald-500/90 text-white border-white/20' : 
                    c.status === 'ANUNCIADA' ? 'bg-white/90 text-slate-800 border-slate-100' : 'bg-brand-teal/90 text-white border-white/10'
                  }`}>
                    {c.status}
                  </div>

                  <div className="h-48 relative overflow-hidden bg-slate-50">
                    <img 
                      src={c.foto_item_url || MATERIAL_PLACEHOLDERS[c.material]} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      onError={(e) => { (e.target as HTMLImageElement).src = MATERIAL_PLACEHOLDERS[c.material]; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  <div className="p-8 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] mb-1">{c.material}</p>
                            <h4 className="font-black text-slate-800 text-lg uppercase italic leading-none">{c.weight} kg estimados</h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <MapPin size={12} className="text-slate-300" /> {c.neighborhood}
                    </div>

                    {['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status) ? (
                      <button onClick={() => setConfirmingCodeId(c.id)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-brand-teal transition-all shadow-lg active:scale-95">
                        <ShieldCheck size={14} /> Validar Coleta
                      </button>
                    ) : c.status === 'CONCLUIDA' ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] bg-emerald-50 p-4 rounded-2xl border border-emerald-100 justify-center">
                         <CheckCircle2 size={16} /> Ciclo Encerrado
                      </div>
                    ) : (
                      <div className="text-center py-2 border-2 border-dashed border-slate-100 rounded-2xl">
                         <p className="text-[9px] font-black text-slate-300 uppercase italic">Aguardando Coletor...</p>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 bg-white rounded-[4rem] border border-dashed border-slate-200 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Megaphone size={40} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma carga anunciada hoje.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        /* Perfil remains focused but secondary */
        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 max-w-xl mx-auto shadow-sm space-y-10 text-center animate-in zoom-in duration-500">
            {/* ... perfil content same as previous but styled to match ... */}
            <div className="relative inline-block group">
                <img src={user.foto_perfil_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-44 h-44 rounded-[4rem] border-8 border-slate-50 mx-auto shadow-2xl object-cover transition-transform group-hover:scale-105" />
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-5 rounded-3xl shadow-xl hover:bg-brand-teal transition-all active:scale-90"><Camera size={24} /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processAndSetImage(e.target.files[0])} />
            <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">{user.name}</h3>
            {/* onLogout is now correctly provided via props */}
            <button onClick={onLogout} className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 tracking-widest">Encerrar Sessão</button>
        </div>
      )}

      {/* Modal Flow "Express" */}
      {isModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] md:rounded-[4rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-teal/10 text-brand-teal">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Carga de {selectedMaterial}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Passo Final: Detalhes e Foto</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 p-2"><X size={28} /></button>
            </div>

            <form onSubmit={handlePublish} className="space-y-8">
              {/* Drop/Click Area for Photo */}
              <div 
                onClick={() => itemFileInputRef.current?.click()} 
                className={`group relative h-64 rounded-[3.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                    previewUrl ? 'border-brand-teal bg-slate-50' : 'border-slate-100 bg-slate-50 hover:border-brand-teal'
                }`}
              >
                <input type="file" ref={itemFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processAndSetImage(e.target.files[0])} />
                {previewUrl ? (
                    <>
                        <img src={previewUrl} className="w-full h-full object-cover animate-in zoom-in" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <RefreshCw className="text-white" size={32} />
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                            <Camera className="text-brand-teal" size={32} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tirar ou Anexar Foto</p>
                    </div>
                )}
              </div>

              <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Peso Aproximado</label>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                        <input name="weight" type="number" step="0.5" required defaultValue="5" className="flex-1 bg-transparent p-4 font-black text-2xl text-slate-800 outline-none text-center" />
                        <span className="bg-white px-6 py-4 rounded-2xl font-black text-slate-400 uppercase text-[10px] shadow-sm">Quilos (KG)</span>
                    </div>
                  </div>

                  {/* Status de GPS Invisível / Automático */}
                  <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 py-3 rounded-2xl">
                     {isLocating ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={14} />}
                     {coords ? 'Localização Confirmada ✓' : 'Buscando GPS...'}
                  </div>
              </div>

              <button type="submit" className="group w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl hover:bg-brand-teal transition-all active:scale-95 flex items-center justify-center gap-3">
                <Sparkles size={20} className="group-hover:animate-pulse" /> Publicar Agora
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Handshake Modal */}
      {confirmingCodeId && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 text-center space-y-10 border-4 border-slate-50 animate-in zoom-in">
            <div className="w-24 h-24 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto text-brand-teal shadow-inner">
                <ShieldCheck size={48} />
            </div>
            <div>
                <h3 className="text-2xl font-black uppercase italic text-slate-800 tracking-tighter">Validar Ciclo</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Insira o Token do Coletor</p>
            </div>
            <input 
                value={inputCode} 
                onChange={e => setInputCode(e.target.value.replace(/\D/g, ''))} 
                maxLength={6} 
                autoFocus
                className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] text-center text-5xl font-black text-slate-800 tracking-widest outline-none focus:border-brand-teal transition-all shadow-inner" 
                placeholder="000000" 
            />
            <div className="grid grid-cols-1 gap-4">
                <button onClick={() => {
                    const col = collections.find(c => c.id === confirmingCodeId);
                    if (col && col.codigo_confirmacao === inputCode) {
                        onUpdate({ ...col, status: 'CONCLUIDA', ts_concluida: new Date().toISOString() });
                        setConfirmingCodeId(null);
                        setInputCode('');
                    }
                }} className="w-full bg-brand-teal text-white py-6 rounded-2xl font-black uppercase shadow-xl hover:bg-brand-tealDark active:scale-95 transition-all">
                    Finalizar Descarte
                </button>
                <button onClick={() => setConfirmingCodeId(null)} className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserView;
