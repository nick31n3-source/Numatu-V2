
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Megaphone, Plus, X, MapPin, CheckCircle2, Camera, ShieldCheck, 
  ImageIcon, RefreshCw, Locate, ArrowRight, Sparkles, Package, 
  Trash2, Box, FileText, Wine, Hammer, Sprout, HelpCircle, Laptop, 
  LogOut, DollarSign, Eye, Layout, Calendar, Clock, AlertCircle
} from 'lucide-react';
import { User, CollectionData, MaterialType, CollectionStatus } from '../types';
import { MATERIAL_COLORS, MATERIAL_PLACEHOLDERS } from '../constants';
import { GoogleGenAI } from "@google/genai";

const PRICE_PER_KG: Record<MaterialType, number> = {
  'Plástico': 2.50,
  'Papel': 0.85,
  'Vidro': 0.15,
  'Metal': 5.20,
  'Orgânico': 0.40,
  'Eletrônicos': 15.00,
  'Outros': 1.00
};

const MaterialIcon: React.FC<{ type: MaterialType; size?: number; className?: string }> = ({ type, size = 24, className = "" }) => {
  switch (type) {
    case 'Plástico': return <Box size={size} className={className} />;
    case 'Papel': return <FileText size={size} className={className} />;
    case 'Vidro': return <Wine size={size} className={className} />;
    case 'Metal': return <Hammer size={size} className={className} />;
    case 'Orgânico': return <Sprout size={size} className={className} />;
    case 'Eletrônicos': return <Laptop size={size} className={className} />;
    default: return <HelpCircle size={size} className={className} />;
  }
};

const AdvertiserView: React.FC<{
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
  onAdd: (col: CollectionData) => void;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}> = ({ user, collections, onUpdate, onAdd, onUpdateUser, onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ADS' | 'PROFILE'>('ADS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Ad Form States
  const [adId, setAdId] = useState<string>(`COL-${Date.now()}`);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('Plástico');
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [weight, setWeight] = useState(10);
  const [pricePerKg, setPricePerKg] = useState(PRICE_PER_KG['Plástico']);
  const [gallery, setGallery] = useState<string[]>([]);
  const [adStatus, setAdStatus] = useState<CollectionStatus>('ANUNCIADA');
  const [confirmingCodeId, setConfirmingCodeId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const myCollections = useMemo(() => 
    collections.filter(c => c.id_anunciante === user.id),
  [collections, user.id]);

  // Auto-Save Draft
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        const draft = { adTitle, adDesc, weight, pricePerKg, gallery, selectedMaterial };
        localStorage.setItem(`draft_${adId}`, JSON.stringify(draft));
        console.log("Draft saved automatically.");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [adTitle, adDesc, weight, pricePerKg, gallery, isModalOpen]);

  const handleStartFlow = (material: MaterialType) => {
    setSelectedMaterial(material);
    setPricePerKg(PRICE_PER_KG[material]);
    setAdTitle(`${material} para Reciclagem - ${user.bairro}`);
    setAdDesc(`Lote de ${material} limpo e separado, pronto para coleta imediata.`);
    setGallery([]);
    setAdId(`COL-${Date.now()}`);
    setIsModalOpen(true);
  };

  // Fix: use recommended structure (Content[]) for generateContent and handle response safely
  const handleAiGenerate = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Atue como um especialista em logística reversa. Crie um anúncio profissional para:
      Material: ${selectedMaterial}
      Peso: ${weight}kg
      Localização: ${user.bairro}, ${user.cidade}
      Empresa: ${user.name}
      
      Responda EXCLUSIVAMENTE em formato JSON:
      {
        "titulo": "Título curto e impactante",
        "descricao": "Descrição detalhada com 2 parágrafos enfatizando qualidade e urgência",
        "preco_sugerido_kg": 0.00
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.replace(/```json|```/g, '').trim());
      setAdTitle(data.titulo || adTitle);
      setAdDesc(data.descricao || adDesc);
      setPricePerKg(data.preco_sugerido_kg || PRICE_PER_KG[selectedMaterial]);
    } catch (err) {
      alert("Erro ao conectar com a IA. Tente manualmente.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Fix: cast the array elements to File to satisfy readAsDataURL which expects a Blob
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setGallery(prev => [...prev, ev.target?.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  const handlePublish = (status: CollectionStatus = 'ANUNCIADA') => {
    const newAnuncio: CollectionData = {
      id: adId,
      id_anunciante: user.id,
      status: status,
      material: selectedMaterial,
      title: adTitle,
      description: adDesc,
      weight,
      price_suggested: pricePerKg * weight,
      city: user.cidade || 'São Paulo',
      neighborhood: user.bairro || 'Centro',
      address: user.rua ? `${user.rua}, ${user.numero}` : 'Endereço não informado',
      lat: user.last_lat || -23.5505,
      lng: user.last_lng || -46.6333,
      companyName: user.name,
      companyAvatar: user.foto_perfil_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`,
      foto_item_url: gallery[0] || MATERIAL_PLACEHOLDERS[selectedMaterial],
      foto_item_urls: gallery,
      ts_solicitada: new Date().toISOString(),
      prioridade: weight > 100 ? 'Alta' : 'Média',
    };
    
    onAdd(newAnuncio);
    setIsModalOpen(false);
    localStorage.removeItem(`draft_${adId}`);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Tab Switcher */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit mx-auto md:mx-0 shadow-inner">
        <button onClick={() => setActiveSubTab('ADS')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'ADS' ? 'bg-white text-brand-blue shadow-md' : 'text-slate-500'}`}>Cargas e Descartes</button>
        <button onClick={() => setActiveSubTab('PROFILE')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'PROFILE' ? 'bg-white text-brand-blue shadow-md' : 'text-slate-500'}`}>Configurações</button>
      </div>

      {activeSubTab === 'ADS' ? (
        <div className="space-y-12">
          {/* Materiais Grid */}
          <section className="space-y-6">
            <div className="flex items-end justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Novo Descarte</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gere um anúncio em 1 clique</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico', 'Eletrônicos'] as MaterialType[]).map(mat => (
                <button 
                  key={mat} 
                  onClick={() => handleStartFlow(mat)}
                  className="group relative h-36 rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-brand-green hover:scale-[1.03] transition-all bg-white shadow-sm flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${MATERIAL_COLORS[mat]}15`, color: MATERIAL_COLORS[mat] }}>
                    <MaterialIcon type={mat} size={24} />
                  </div>
                  <p className="font-black uppercase italic text-[9px] tracking-tighter text-slate-600">{mat}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Listagem */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Package className="text-brand-blue" size={20} />
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-800">Gestão de Cargas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCollections.map(c => (
                <div key={c.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className="h-44 relative bg-slate-50">
                    <img src={c.foto_item_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg border backdrop-blur-md ${
                      c.status === 'CONCLUIDA' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-800'
                    }`}>
                      {c.status}
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[10px] font-black uppercase" style={{ color: MATERIAL_COLORS[c.material] }}>{c.material}</p>
                          <h4 className="font-black text-slate-800 text-lg uppercase italic">{c.weight} kg</h4>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Estimado</p>
                          <p className="text-lg font-black text-brand-green italic">R$ {c.price_suggested?.toFixed(2)}</p>
                       </div>
                    </div>
                    {c.status === 'ANUNCIADA' && (
                       <button onClick={() => setConfirmingCodeId(c.id)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> Validar Entrega
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="max-w-xl mx-auto py-12 text-center space-y-8 animate-in zoom-in">
           <div className="relative inline-block group">
              <img src={user.foto_perfil_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-40 h-40 rounded-[3.5rem] border-8 border-white shadow-2xl mx-auto object-cover" />
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-brand-blue"><Camera size={18} /></button>
           </div>
           <input type="file" ref={fileInputRef} className="hidden" />
           <h3 className="text-2xl font-black italic uppercase text-slate-800">{user.name}</h3>
           <button onClick={onLogout} className="text-xs font-black text-red-500 uppercase flex items-center gap-2 mx-auto"><LogOut size={16} /> Sair do Painel</button>
        </div>
      )}

      {/* NOVO MODAL DE ANÚNCIO (ESTILO WIZARD COM PREVIEW) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom duration-500">
            
            {/* Lado Esquerdo: Formulário */}
            <div className="flex-1 p-10 md:p-14 overflow-y-auto custom-scrollbar space-y-10">
              <div className="flex justify-between items-center">
                <div>
                   <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Nova Carga de {selectedMaterial}</span>
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 mt-2">Criar Anúncio</h2>
                </div>
                <button onClick={() => handleAiGenerate()} disabled={isAiLoading} className="bg-brand-teal text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                   {isAiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />} Sugerir via IA
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Título do Anúncio</label>
                   <input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Ex: Lote de 50kg de PET separado" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 font-bold outline-none focus:border-brand-blue" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Peso (KG)</label>
                      <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 font-black text-xl outline-none focus:border-brand-blue" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Preço Sugerido / KG</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                        <input type="number" step="0.01" value={pricePerKg} onChange={e => setPricePerKg(Number(e.target.value))} className="w-full p-5 pl-12 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 font-black text-xl outline-none focus:border-brand-blue" />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Descrição Operacional</label>
                   <textarea value={adDesc} onChange={e => setAdDesc(e.target.value)} rows={4} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-800 text-sm font-medium outline-none focus:border-brand-blue" />
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Galeria de Fotos (Até 5)</label>
                      <button onClick={() => galleryInputRef.current?.click()} className="text-[10px] font-black text-brand-blue uppercase flex items-center gap-1"><Plus size={14} /> Adicionar</button>
                   </div>
                   <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   <div className="flex gap-3 overflow-x-auto pb-2">
                      {gallery.map((img, i) => (
                        <div key={i} className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-100 group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => setGallery(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white/80 p-1 rounded-lg text-red-500 opacity-0 group-hover:opacity-100"><X size={12} /></button>
                        </div>
                      ))}
                      {gallery.length === 0 && (
                        <div onClick={() => galleryInputRef.current?.click()} className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-100"><ImageIcon size={24} /></div>
                      )}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                 <button onClick={() => handlePublish('RASCUNHO')} className="bg-slate-100 text-slate-500 py-6 rounded-3xl font-black uppercase text-[10px] shadow-sm hover:bg-slate-200 transition-all">Salvar Rascunho</button>
                 <button onClick={() => handlePublish('ANUNCIADA')} className="bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[10px] shadow-xl hover:bg-brand-green transition-all">Publicar Agora</button>
              </div>
            </div>

            {/* Lado Direito: Preview Mobile Real-Time */}
            <div className="hidden lg:flex w-[400px] bg-slate-50 border-l border-slate-100 flex-col items-center justify-center p-10 relative">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600"><X size={32} /></button>
               
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10">Live Preview</p>
               
               {/* Mockup de Mobile */}
               <div className="w-full bg-white rounded-[3.5rem] shadow-2xl border-8 border-slate-900 aspect-[9/18] overflow-hidden flex flex-col">
                  <div className="h-44 bg-slate-100 relative">
                     {gallery[0] ? <img src={gallery[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={48} /></div>}
                     <div className="absolute top-3 right-3 bg-brand-teal text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase">ANUNCIADA</div>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: MATERIAL_COLORS[selectedMaterial] }}>{selectedMaterial}</p>
                        <h4 className="text-sm font-black text-slate-800 uppercase italic line-clamp-2">{adTitle || "Título do seu anúncio"}</h4>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">
                           {weight}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">KG Estimados</span>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Sugestão de Mercado</p>
                        <p className="text-lg font-black text-brand-green italic leading-none">R$ {(weight * pricePerKg).toFixed(2)}</p>
                     </div>
                     <div className="space-y-1 pt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Detalhes</p>
                        <p className="text-[9px] font-medium text-slate-500 line-clamp-3 leading-relaxed">{adDesc || "Descrição do material..."}</p>
                     </div>
                     <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-brand-teal"></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">{user.name}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO (CÓDIGO) */}
      {confirmingCodeId && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-8 max-w-sm w-full animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck size={40} />
            </div>
            <div>
                <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Handshake Seguro</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Valide o token do coletor</p>
            </div>
            <input type="text" maxLength={6} value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="000000" className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl py-6 text-center text-4xl font-black tracking-[0.3em] text-slate-800 outline-none focus:border-brand-blue transition-all" />
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const target = collections.find(c => c.id === confirmingCodeId);
                  if (target && inputCode === target.codigo_confirmacao) {
                    onUpdate({...target, status: 'CONCLUIDA', ts_concluida: new Date().toISOString()});
                    setConfirmingCodeId(null);
                    setInputCode('');
                  } else { alert("Código Inválido!"); }
                }}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
              > Confirmar Entrega </button>
              <button onClick={() => { setConfirmingCodeId(null); setInputCode(''); }} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserView;
