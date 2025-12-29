
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Megaphone, Plus, X, MapPin, Locate, CheckCircle2, Camera, Save, Key, ShieldCheck, ImageIcon, Truck, UserCheck, RefreshCcw } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileName, setProfileName] = useState(user.nome_publico || user.name);
  const [profileBio, setProfileBio] = useState(user.bio || 'Gerador consciente de resíduos.');
  const [profileImage, setProfileImage] = useState(user.foto_perfil_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);

  const myCollections = useMemo(() => 
    collections.filter(c => c.id_anunciante === user.id),
  [collections, user.id]);

  const handlePublish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!coords) return alert("Habilite o GPS para anunciar.");
    
    const formData = new FormData(e.currentTarget);
    const newAnuncio: CollectionData = {
      id: `COL-${Date.now()}`,
      id_anunciante: user.id,
      status: 'ANUNCIADA',
      material: formData.get('material') as MaterialType,
      weight: Number(formData.get('weight')),
      city: formData.get('city') as string,
      neighborhood: formData.get('neighborhood') as string,
      address: formData.get('address') as string,
      lat: coords.lat,
      lng: coords.lng,
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
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.5));
      };
    };
  };

  const validateCode = () => {
    const col = collections.find(c => c.id === confirmingCodeId);
    if (col && col.codigo_confirmacao === inputCode.trim().toUpperCase()) {
      onUpdate({ ...col, status: 'CONCLUIDA', ts_concluida: new Date().toISOString() });
      setConfirmingCodeId(null);
      setInputCode('');
      alert("✅ Handshake Concluído!");
    } else {
      alert("❌ Código incorreto.");
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveSubTab('ADS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'ADS' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Cargas</button>
        <button onClick={() => setActiveSubTab('PROFILE')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'PROFILE' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>Perfil</button>
      </div>

      {activeSubTab === 'ADS' ? (
        <>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand-teal text-white rounded-2xl"><Megaphone size={28} /></div>
              <div><h2 className="text-xl font-black italic uppercase tracking-tighter">Gestão de Resíduos</h2></div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-brand-teal">
              <Plus size={18} /> Novo Anúncio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCollections.length > 0 ? myCollections.map(c => (
              <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="h-40 relative">
                  <img src={c.foto_item_url} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4">{c.status}</div>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="font-black uppercase italic text-slate-800">{c.material} - {c.weight}kg</h3>
                  <div className="pt-4 border-t border-slate-50">
                    {['ACEITA', 'EM_ROTA', 'EM_COLETA'].includes(c.status) ? (
                      <button onClick={() => setConfirmingCodeId(c.id)} className="w-full bg-brand-teal text-white py-4 rounded-xl font-black text-[10px] uppercase">Validar Handshake</button>
                    ) : c.status === 'CONCLUIDA' ? (
                      <div className="text-center text-brand-green font-black text-[10px] uppercase">Processado ✓</div>
                    ) : <div className="text-center text-slate-300 font-black text-[10px] uppercase animate-pulse">Aguardando Coletor...</div>}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-bold uppercase text-xs">Sem cargas ativas. Crie uma nova acima!</div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 max-w-xl mx-auto text-center space-y-8">
           <div className="relative inline-block">
             <img src={profileImage} className="w-32 h-32 rounded-full border-4 border-slate-100 object-cover" />
             <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-teal text-white p-2 rounded-full shadow-lg"><Camera size={16} /></button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0], setProfileImage)} />
           </div>
           <div className="space-y-4 text-left">
             <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Nome Público" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
             <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="Bio" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold h-24" />
             <button onClick={() => onUpdateUser({...user, nome_publico: profileName, bio: profileBio, foto_perfil_url: profileImage})} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs">Salvar Perfil</button>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-brand-teal text-white flex justify-between items-center font-black uppercase italic">
              <span>Nova Carga</span>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePublish} className="p-8 space-y-5">
              <div onClick={() => itemFileInputRef.current?.click()} className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                <input type="file" ref={itemFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0], setNewItemImage)} />
                {newItemImage ? <img src={newItemImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="material" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"><option>Papel</option><option>Plástico</option><option>Vidro</option><option>Metal</option></select>
                <input name="weight" type="number" placeholder="Peso (kg)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <button type="button" onClick={() => navigator.geolocation.getCurrentPosition(p => setCoords({lat: p.coords.latitude, lng: p.coords.longitude}))} className={`w-full p-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${coords ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {coords ? 'Localização OK' : 'Ativar GPS da Carga'}
              </button>
              <input name="neighborhood" placeholder="Bairro" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              <input name="address" placeholder="Endereço Completo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              <button type="submit" className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl">Publicar Agora</button>
            </form>
           </div>
        </div>
      )}

      {confirmingCodeId && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center space-y-6">
            <h3 className="text-xl font-black uppercase italic text-brand-teal">Validar Handshake</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase">Insira os 6 dígitos fornecidos pelo coletor</p>
            <input value={inputCode} onChange={e => setInputCode(e.target.value)} maxLength={6} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-3xl font-black tracking-widest" placeholder="000000" />
            <div className="flex gap-2">
              <button onClick={() => setConfirmingCodeId(null)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Fechar</button>
              <button onClick={validateCode} className="flex-1 bg-brand-teal text-white py-4 rounded-xl font-black uppercase text-[10px]">Validar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserView;
