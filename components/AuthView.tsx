
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Leaf, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Phone, 
  RefreshCw, Sparkles, ShieldCheck, CheckCircle2, Navigation, Building2, MapPin, Smartphone, XCircle, CheckCircle, Search, MapPinOff
} from 'lucide-react';
import { UserRole, User } from '../types';
import { DatabaseService } from '../database';
import { GoogleGenAI } from "@google/genai";

// Funções de Máscara
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
const maskCNPJ = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
const maskPhone = (v: string) => {
  let r = v.replace(/\D/g, '');
  if (r.length > 11) r = r.slice(0, 11);
  if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  if (r.length > 5) return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  if (r.length > 2) return r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
  if (r.length > 0) return r.replace(/^(\d*)/, "($1");
  return r;
};

// Validação Algorítmica (Módulo 11)
const isValidCPF = (cpf: string) => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || !!clean.match(/(\d)\1{10}/)) return false;
  let s = 0;
  for (let i = 1; i <= 9; i++) s += parseInt(clean.substring(i - 1, i)) * (11 - i);
  let r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(clean.substring(9, 10))) return false;
  s = 0;
  for (let i = 1; i <= 10; i++) s += parseInt(clean.substring(i - 1, i)) * (12 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(clean.substring(10, 11));
};

const isValidCNPJ = (cnpj: string) => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14 || !!clean.match(/(\d)\1{13}/)) return false;
  const b = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += parseInt(clean[i]) * b[i];
  let r = s % 11;
  if (parseInt(clean[12]) !== (r < 2 ? 0 : 11 - r)) return false;
  const b2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  s = 0;
  for (let i = 0; i < 13; i++) s += parseInt(clean[i]) * b2[i];
  r = s % 11;
  return parseInt(clean[13]) === (r < 2 ? 0 : 11 - r);
};

const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('ADVERTISER');
  const [porte, setPorte] = useState<'PEQUENA' | 'MEDIA' | 'GRANDE'>('PEQUENA');
  const [bio, setBio] = useState('');

  // Step 3 Validation States
  const [cnpj, setCnpj] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isCnpjDuplicate, setIsCnpjDuplicate] = useState(false);
  const [isCpfDuplicate, setIsCpfDuplicate] = useState(false);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);

  // Step 4 Address States
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [numero, setNumero] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    DatabaseService.getUsers().then(setExistingUsers);
  }, []);

  // Debounce check for uniqueness
  useEffect(() => {
    if (step !== 3) return;
    const timeout = setTimeout(async () => {
      setIsCheckingUniqueness(true);
      const users = await DatabaseService.getUsers();
      const cleanCpf = cpf.replace(/\D/g, '');
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      setIsCpfDuplicate(cleanCpf.length > 0 && users.some(u => u.cpf?.replace(/\D/g, '') === cleanCpf));
      setIsCnpjDuplicate(cleanCnpj.length > 0 && users.some(u => u.cnpj?.replace(/\D/g, '') === cleanCnpj));
      setIsCheckingUniqueness(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [cpf, cnpj, step]);

  // CEP Lookup Logic
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const fetchAddress = async () => {
        setIsLoadingAddress(true);
        setError(null);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          
          if (data.erro) {
            setError("CEP não encontrado. Verifique os números.");
          } else {
            setEndereco(data.logradouro || '');
            setBairro(data.bairro || '');
            setCidade(data.localidade || '');
            // Move focus to number field for better UX
            setTimeout(() => {
              const numInput = document.getElementById('num-input');
              if (numInput) numInput.focus();
            }, 100);
          }
        } catch (err) {
          setError("Erro ao buscar endereço. Tente preencher manualmente.");
        } finally {
          setIsLoadingAddress(false);
        }
      };
      
      const timeout = setTimeout(fetchAddress, 300);
      return () => clearTimeout(timeout);
    }
  }, [cep]);

  // Fix: use the recommended content structure (Content[]) and safer response handling
  const handleGenerateBio = async () => {
    if (!name) return setError("Preencha o nome no passo anterior.");
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Escreva um propósito ESG de 140 caracteres para a empresa/coletor ${name} (${role}) de porte ${porte}. Seja inspirador e direto.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: [{ parts: [{ text: prompt }] }] 
      });
      setBio(response.text?.trim() || "");
    } catch (err) { setError("Falha na IA. Tente manualmente."); }
    finally { setIsAiGenerating(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const users = await DatabaseService.getUsers();
      const user = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password);
      if (user) onLogin(user);
      else setError("Dados inválidos.");
    } catch (err) { setError("Erro de conexão."); }
    finally { setLoading(false); }
  };

  const handleFinalizeRegister = async () => {
    if (!cep || !endereco || !numero || !bairro || !cidade) {
      setError("Por favor, complete todos os campos de localização.");
      return;
    }
    setLoading(true);
    try {
      const newUser: User = {
        id: `USR-${Date.now()}`,
        username: email.split('@')[0],
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role,
        isActive: true,
        isProfileComplete: true,
        face_verified: false,
        email_verificado: true,
        telefone_verificado: true,
        cpf_verificado: true,
        cnpj_verificado: true,
        endereco_verificado: true,
        tipo_empresa: porte,
        bio,
        cnpj: cnpj.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, ''),
        telefone: whatsapp.replace(/\D/g, ''),
        cep: cep.replace(/\D/g, ''),
        rua: endereco,
        numero,
        bairro,
        cidade
      };
      await DatabaseService.saveUser(newUser);
      onLogin(newUser);
    } catch (err) { setError("Falha ao salvar parceiro."); }
    finally { setLoading(false); }
  };

  const isStep3Valid = isValidCPF(cpf) && isValidCNPJ(cnpj) && whatsapp.replace(/\D/g, '').length >= 10 && !isCpfDuplicate && !isCnpjDuplicate;

  if (mode === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-in zoom-in duration-500">
          <div className="glass-card rounded-[3.5rem] p-10 md:p-14 text-center">
             <div className="mb-12">
                <Leaf size={44} className="text-brand-green mx-auto mb-4" />
                <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">NUMATU</h1>
             </div>
             {error && <div className="mb-6 p-4 bg-red-500/20 text-white rounded-2xl text-xs font-bold">{error}</div>}
             <form onSubmit={handleLogin} className="space-y-6">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full p-5 bg-white/10 rounded-3xl text-white outline-none" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-5 bg-white/10 rounded-3xl text-white outline-none" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest">
                  {loading ? <RefreshCw className="animate-spin mx-auto" /> : "Entrar"}
                </button>
                <button type="button" onClick={() => setMode('REGISTER')} className="text-[10px] font-black uppercase text-white/60 mx-auto mt-4">Criar nova conta de parceiro</button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12">
        <div className="h-48 mesh-bg relative flex flex-col items-center justify-center text-white">
          <Leaf size={48} className="text-brand-green mb-2" />
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">NUMATU</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Cadastro de Parceiro</p>
        </div>

        <div className="p-10 md:p-12 -mt-10 bg-white rounded-t-[4rem] relative z-20 min-h-[500px]">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => step === 1 ? setMode('LOGIN') : setStep(s => s - 1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-all">
               <ArrowLeft size={20} />
            </button>
            <div className="flex gap-1.5">
               {[1,2,3,4].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all ${step === s ? 'w-8 bg-brand-blue' : 'w-2 bg-slate-100'}`}></div>
               ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">Primeiros Passos</h3>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-3xl">
                <button onClick={() => setRole('ADVERTISER')} className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${role === 'ADVERTISER' ? 'bg-white text-brand-blue shadow-lg' : 'text-slate-400'}`}>Gerador</button>
                <button onClick={() => setRole('COLLECTOR')} className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${role === 'COLLECTOR' ? 'bg-white text-brand-green shadow-lg' : 'text-slate-400'}`}>Coletor</button>
              </div>
              <div className="space-y-4">
                <input placeholder="Nome ou Razão Social" value={name} onChange={e => setName(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none" />
                <input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none" />
                <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none" />
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-brand-blue text-white py-6 rounded-[2.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">Próximo <ArrowRight size={20} /></button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">Perfil de Impacto</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {(['PEQUENA', 'MEDIA', 'GRANDE'] as const).map(p => (
                    <button key={p} onClick={() => setPorte(p)} className={`py-4 rounded-2xl text-[9px] font-black uppercase border-2 transition-all ${porte === p ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-50 text-slate-400'}`}>{p}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio / Propósito</label>
                    <button onClick={handleGenerateBio} disabled={isAiGenerating} className="text-[9px] font-black text-brand-blue uppercase flex items-center gap-1">
                      {isAiGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Sugerir IA
                    </button>
                  </div>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Sua jornada..." className="w-full p-6 bg-slate-50 rounded-[2rem] text-slate-800 min-h-[120px] outline-none" />
                </div>
              </div>
              <button onClick={() => setStep(3)} className="w-full bg-brand-blue text-white py-6 rounded-[2.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">Validação Única <ArrowRight size={20} /></button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-brand-blue" />
                <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Validação Única</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                   <div className="flex justify-between px-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ (Apenas números)</label>
                     {cnpj.length >= 18 && (isValidCNPJ(cnpj) && !isCnpjDuplicate ? <CheckCircle size={14} className="text-brand-green" /> : <XCircle size={14} className="text-red-500" />)}
                   </div>
                   <input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(maskCNPJ(e.target.value))} className={`w-full p-5 bg-slate-50 border-2 rounded-3xl text-slate-800 outline-none transition-all ${cnpj.length > 0 && (!isValidCNPJ(cnpj) || isCnpjDuplicate) ? 'border-red-200' : 'border-slate-50 focus:border-brand-blue'}`} />
                   {isCnpjDuplicate && <p className="text-[9px] text-red-500 font-bold uppercase px-4">Este CNPJ já está cadastrado no ecossistema.</p>}
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between px-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF RESPONSÁVEL</label>
                     {cpf.length >= 14 && (isValidCPF(cpf) && !isCpfDuplicate ? <CheckCircle size={14} className="text-brand-green" /> : <XCircle size={14} className="text-red-500" />)}
                   </div>
                   <input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} className={`w-full p-5 bg-slate-50 border-2 rounded-3xl text-slate-800 outline-none transition-all ${cpf.length > 0 && (!isValidCPF(cpf) || isCpfDuplicate) ? 'border-red-200' : 'border-slate-50 focus:border-brand-blue'}`} />
                   {isCpfDuplicate && <p className="text-[9px] text-red-500 font-bold uppercase px-4">Este CPF já está em uso por outro parceiro.</p>}
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">WHATSAPP DIRETO</label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 tracking-tighter">+55</span>
                      <input placeholder="(00) 00000-0000" value={whatsapp} onChange={e => setWhatsapp(maskPhone(e.target.value))} className="w-full p-5 pl-14 bg-slate-50 border border-slate-50 rounded-3xl text-slate-800 outline-none focus:border-brand-blue" />
                   </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setStep(4)} 
                  disabled={!isStep3Valid || isCheckingUniqueness}
                  className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl transition-all ${isStep3Valid ? 'bg-brand-blue text-white active:scale-95' : 'bg-slate-100 text-slate-300 grayscale cursor-not-allowed'}`}
                >
                  {isCheckingUniqueness ? <RefreshCw className="animate-spin" size={18} /> : <>Logística Final <ArrowRight size={20} /></>}
                </button>
                {!isStep3Valid && cnpj.length > 10 && <p className="text-[8px] text-center text-slate-400 font-black uppercase mt-4 tracking-widest">Valide os documentos acima para prosseguir</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter flex items-center gap-3">
                <MapPin className="text-brand-blue" /> Localização
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2 relative">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CEP</label>
                   <div className="relative">
                     <input 
                       placeholder="00000-000" 
                       value={cep} 
                       onChange={e => setCep(maskCEP(e.target.value))} 
                       className={`w-full p-5 pr-12 bg-slate-50 border rounded-3xl text-slate-800 outline-none transition-all ${isLoadingAddress ? 'border-brand-blue' : 'border-slate-100 focus:border-brand-blue'}`} 
                     />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       {isLoadingAddress ? <RefreshCw size={16} className="text-brand-blue animate-spin" /> : <Search size={16} className="text-slate-300" />}
                     </div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nº</label>
                   <input id="num-input" placeholder="000" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none focus:border-brand-blue" />
                </div>
              </div>

              {error && error.includes("CEP") && <p className="text-[10px] text-red-500 font-black uppercase px-4 flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Logradouro</label>
                 <input placeholder="Rua, Avenida, Praça..." value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none focus:border-brand-blue" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bairro</label>
                   <input placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none focus:border-brand-blue" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cidade</label>
                   <input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-800 outline-none focus:border-brand-blue" />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleFinalizeRegister} 
                  disabled={loading || isLoadingAddress || !cep || !endereco || !numero} 
                  className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl transition-all ${(!cep || !endereco || !numero || loading) ? 'bg-slate-100 text-slate-300 grayscale' : 'bg-brand-green text-brand-tealDark active:scale-95'}`}
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <>Finalizar e Ativar <CheckCircle2 size={20} /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
