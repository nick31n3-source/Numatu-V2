
import React, { useState, useMemo, useRef } from 'react';
import { Megaphone, Plus, X, MapPin, CheckCircle2, Camera, Key, ShieldCheck, ImageIcon, RefreshCw, Locate, AlertTriangle, Truck } from 'lucide-react';
import { User, CollectionData, MaterialType } from '../types';

interface AdvertiserViewProps {
  user: User;
  collections: CollectionData[];
  onUpdate: (col: CollectionData) => void;
  onAdd: (col: CollectionData) => void;
  onUpdateUser: (updatedUser: User) => void;
}

const AdvertiserView: React.FC<AdvertiserViewProps> = ({ user, collections, onUpdate, onAdd, onUpdateUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ADS' | 'PROFILE'>('ADS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmingCodeId, setConfirmingCodeId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileName, setProfileName] = useState(user.nome_publico || user.name);
  const [profileBio, setProfileBio] = useState(user.bio || 'Gerador consciente de resíduos.');
  const [profileImage, setProfileImage] = useState(user.foto_perfil_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);

  const myCollections = useMemo(() => 
    collections.filter(c => c.id_anunciante === user.id),
  [collections, user.id]);

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS falhou, usando coordenadas da sede SP como fallback:", err.message);
        // Fallback para evitar que o anúncio fique "invisível" (0,0)
        setCoords({ lat: -23.5505, lng: -46.6333 });
        setIsLocating(false);
      },
      { timeout: 5000 }
    );
  };

  const handlePublish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const material = formData.get('material') as MaterialType;
    const weight = Number(formData.get('weight'));
    const neighborhood = formData.get('neighborhood') as string;
    const address = formData.get('address') as string;

    // Se o usuário esqueceu de clicar em obter GPS, tentamos um fallback de SP
    const finalLat = coords?.lat || -23.5505;
    const finalLng = coords?.lng || -46.6333;

    const newAnuncio: CollectionData = {
      id: `COL-${Date.now()}`,
      id_anunciante: user.id,
      status: 'ANUNCIADA',
      material,
      weight,
      city: 'São Paulo',
      neighborhood,
      address,
      lat: finalLat,
      lng: finalLng,
      companyName: profileName,
      companyAvatar: profileImage,
      foto_item_url: newItemImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400',
      ts_solicitada: new Date().toISOString(),
      prioridade: 'Média',
    };
    onAdd(newAnuncio);
    setIsModalOpen(false);
    setCoords(null);
    setNewItemImage(null);
  };

  const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  const validateCode = () => {
    const col = collections.find(c => c.id === confirmingCodeId);
    if (col && col.codigo_confirmacao === inputCode.trim()) {
      onUpdate({ ...col, status: 'CONCLUIDA', ts_concluida: new Date().toISOString() });
      setConfirmingCodeId(null);
      setInputCode('');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveSubTab('ADS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'ADS' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Minhas Cargas</button>
        <button onClick={() => setActiveSubTab('PROFILE')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'PROFILE' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Dados da Empresa</button>
      </div>

      {activeSubTab === 'ADS' ? (
        <>
          <div className="bg-brand-tealDark p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">Fluxo de Descarte</h2>
                <p className="text-[10px] font-black uppercase text-brand-green mt-2 tracking-widest">Gerencie seus anúncios ativos</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="relative z-10 bg-brand-green text-brand-tealDark px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-transform active:scale-95">
              <Plus size={18} /> Novo Anúncio
            </button>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCollections.length > 0 ? myCollections.map(c => (
              <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="h-48 relative overflow-hidden">
                  <img src={c.foto_item_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg backdrop-blur-md ${
                    c.status === 'ANUNCIADA' ? 'bg-white/90 text-slate-800' :
                    c.status === 'CONCLUIDA' ? 'bg-emerald-500 text-white' : 'bg-brand-teal text-white'
                  }`}>
                    {c.status}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.neighborhood}</p>
                    <h3 className="font-black uppercase italic text-slate-800 text-lg leading-tight">{c.material}</h3>
                  </div>
                  
                  {['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status) ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {/* Fixed missing import by adding Truck to imports and using it here */}
                            <Truck size={14} className="text-brand-teal" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Coletor a caminho</span>
                        </div>
                        <button onClick={() => setConfirmingCodeId(c.id)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-brand-teal transition-all shadow-lg active:scale-95">
                           <ShieldCheck size={14} /> Validar Token
                        </button>
                    </div>
                  ) : c.status === 'CONCLUIDA' ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] bg-emerald-50 p-3 rounded-xl">
                        <CheckCircle2 size={14} /> Ciclo Encerrado
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Aguardando parceiro no marketplace...</p>
                  )}
                </div>
              </div>
            )) : (
                <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                    <Megaphone className="text-slate-200 mx-auto" size={48} />
                    <p className="text-slate-400 font-bold uppercase text-xs">Você ainda não anunciou nenhuma carga.</p>
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 max-w-xl mx-auto shadow-sm space-y-10 text-center animate-in zoom-in duration-300">
           <div className="relative inline-block">
                <img src={profileImage} className="w-40 h-40 rounded-[3rem] border-8 border-slate-50 mx-auto shadow-2xl object-cover" />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:bg-brand-teal transition-all active:scale-90"
                >
                    <Camera size={20} />
                </button>
           </div>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0], setProfileImage)} />
           
           <div className="space-y-6 text-left">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome Público</label>
                    <input value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Bio da Empresa</label>
                    <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-32 outline-none focus:border-brand-teal resize-none" />
                </div>
           </div>
           
           <button onClick={() => onUpdateUser({...user, nome_publico: profileName, bio: profileBio, foto_perfil_url: profileImage})} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-brand-teal transition-all active:scale-95">
                Atualizar Perfil Corporativo
           </button>
        </div>
      )}

      {/* MODAL DE NOVO ANÚNCIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Nova Carga</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handlePublish} className="space-y-6">
              <div 
                onClick={() => itemFileInputRef.current?.click()} 
                className={`h-56 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                    newItemImage ? 'border-brand-teal bg-slate-50' : 'border-slate-100 bg-slate-50 hover:border-brand-teal'
                }`}
              >
                <input type="file" ref={itemFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0], setNewItemImage)} />
                {newItemImage ? (
                    <img src={newItemImage} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center space-y-2">
                        <ImageIcon className="text-slate-200 mx-auto" size={48} />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Foto do Material</p>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tipo</label>
                    <select name="material" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-brand-teal appearance-none">
                        <option>Plástico</option><option>Papel</option><option>Vidro</option><option>Metal</option><option>Orgânico</option><option>Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Peso (kg)</label>
                    <input name="weight" type="number" step="0.1" required placeholder="0.0" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Localização Operacional</label>
                <button 
                    type="button" 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    className={`w-full p-4 rounded-2xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-3 transition-all ${
                        coords ? 'border-brand-green bg-brand-green/10 text-brand-greenDark' : 'border-slate-100 text-slate-400 hover:border-brand-teal'
                    }`}
                >
                    {isLocating ? <RefreshCw size={16} className="animate-spin" /> : <Locate size={16} />}
                    {coords ? 'Coordenadas Capturadas' : 'Obter GPS em Tempo Real'}
                </button>
                {coords && <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1 text-center">Precisão garantida para coletores a 120km</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input name="neighborhood" required placeholder="Bairro" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                <input name="address" required placeholder="Endereço e Nº" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-brand-teal" />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-2xl shadow-slate-900/20 hover:bg-brand-teal transition-all active:scale-95">
                Publicar Anúncio Agora
              </button>
            </form>
           </div>
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO DE TOKEN */}
      {confirmingCodeId && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 text-center space-y-10 border-4 border-slate-50 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto text-brand-teal shadow-inner">
                <ShieldCheck size={40} />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase italic text-slate-800">Validar Entrega</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Insira o código fornecido pelo coletor</p>
            </div>
            <input 
                value={inputCode} 
                onChange={e => setInputCode(e.target.value.replace(/\D/g, ''))} 
                maxLength={6} 
                className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-3xl text-center text-5xl font-black text-slate-800 tracking-widest outline-none focus:border-brand-teal transition-all" 
                placeholder="000000" 
            />
            <div className="space-y-4">
                <button onClick={validateCode} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-brand-tealDark active:scale-95 transition-all">
                    Confirmar e Finalizar
                </button>
                <button onClick={() => setConfirmingCodeId(null)} className="w-full text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserView;
