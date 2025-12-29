
import React, { useState, useEffect } from 'react';
import { 
  Leaf, Mail, Lock, ArrowRight, UserPlus, ArrowLeft, AlertCircle, Phone, 
  User as UserIcon, ShieldCheck, CheckCircle2, Key, RefreshCw, MapPin, 
  Building, Truck, Bike, Car, Sparkles, UserCheck 
} from 'lucide-react';
import { UserRole, User } from '../types';
import { DatabaseService } from '../database';
import { GoogleGenAI } from "@google/genai";

type AuthMode = 'LOGIN' | 'REGISTER';
type RegisterStep = 'BASIC' | 'ROLE_SPECIFIC' | 'IDENTITY' | 'ADDRESS';

const isValidCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  let rev = (sum * 10) % 11;
  if ((rev === 10) || (rev === 11)) rev = 0;
  if (rev !== parseInt(cleanCpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  rev = (sum * 10) % 11;
  if ((rev === 10) || (rev === 11)) rev = 0;
  if (rev !== parseInt(cleanCpf.substring(10, 11))) return false;
  return true;
};

const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  if (cleanCnpj.length !== 14) return false;
  return true; // Simplificado para o exemplo, mas expansível
};

const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [regStep, setRegStep] = useState<RegisterStep>('BASIC');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('ADVERTISER');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [bio, setBio] = useState('');
  const [veiculo, setVeiculo] = useState<'BICICLETA' | 'CARROCA' | 'CARRO' | 'CAMINHAO'>('BICICLETA');
  const [porteEmpresa, setPorteEmpresa] = useState<'PEQUENA' | 'MEDIA' | 'GRANDE'>('PEQUENA');

  // Address State
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const generateBioWithAI = async () => {
    if (!name || name.length < 3) return setError("Informe seu nome ou empresa antes de gerar a Bio.");
    setAiGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Crie uma biografia curta (máximo 150 caracteres) e profissional para um perfil no aplicativo NUMATU (Reciclagem e Logística Reversa). O nome do usuário/empresa é: ${name}. O papel dele é: ${role === 'ADVERTISER' ? 'Anunciante de Resíduos' : 'Coletor de Materiais'}. Seja inspirador e focado em sustentabilidade. Responda apenas com a frase da biografia.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setBio(response.text?.trim() || '');
    } catch (err) {
      setError("Não foi possível gerar a Bio automaticamente no momento.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCEPBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
        }
      } catch (e) {
        console.warn("API de CEP indisponível");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const users = await DatabaseService.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError("Credenciais inválidas ou conta não encontrada.");
      }
    } catch (err) {
      setError("Houve uma falha técnica no acesso.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setError(null);
    if (regStep === 'BASIC') {
      if (!name || !email || !password) return setError("Preencha todos os campos.");
      if (password.length < 6) return setError("A senha deve ter no mínimo 6 caracteres.");
      setRegStep('ROLE_SPECIFIC');
    } else if (regStep === 'ROLE_SPECIFIC') {
      setRegStep('IDENTITY');
    } else if (regStep === 'IDENTITY') {
      if (role === 'ADVERTISER' && cnpj && !isValidCNPJ(cnpj)) return setError("CNPJ inválido.");
      if (cpf && !isValidCPF(cpf)) return setError("CPF inválido.");
      if (phone.length < 10) return setError("Informe um telefone válido.");
      setRegStep('ADDRESS');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rua || !numero || !cep) return setError("Endereço é obrigatório.");
    setLoading(true);
    try {
      const newUser: User = {
        id: `USR-${Math.random().toString(36).substr(2, 9)}`,
        username: email.split('@')[0],
        email: email.toLowerCase(),
        password,
        name,
        bio,
        role,
        isProfileComplete: true,
        isActive: true,
        email_verificado: true,
        telefone_verificado: true,
        cpf_verificado: !!cpf,
        cnpj_verificado: !!cnpj,
        endereco_verificado: true,
        face_verified: false,
        telefone: phone,
        cpf,
        cnpj,
        tipo_empresa: role === 'ADVERTISER' ? porteEmpresa : undefined,
        veiculo_tipo: role === 'COLLECTOR' ? veiculo : undefined,
        cep, rua, numero, bairro, cidade, estado
      };
      await DatabaseService.saveUser(newUser);
      onLogin(newUser);
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pattern-grid-lg">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[3.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-gradient-to-br from-brand-tealDark to-brand-teal p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/30 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-white/20">
              <Leaf size={32} className="text-brand-green fill-brand-green" />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">NUMATU</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mt-1">Ecossistema Digital</p>
          </div>
        </div>

        <div className="p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in bounce duration-500">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal transition-all" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal transition-all" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-teal transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Acessar Plataforma <ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={() => {setMode('REGISTER'); setError(null);}} className="w-full mt-4 text-[10px] font-black uppercase text-brand-teal tracking-widest hover:underline flex items-center justify-center gap-2">
                <UserPlus size={14} /> Quero me tornar um parceiro
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => {
                  if (regStep === 'BASIC') setMode('LOGIN');
                  else if (regStep === 'ROLE_SPECIFIC') setRegStep('BASIC');
                  else if (regStep === 'IDENTITY') setRegStep('ROLE_SPECIFIC');
                  else setRegStep('IDENTITY');
                  setError(null);
                }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {['BASIC', 'ROLE_SPECIFIC', 'IDENTITY', 'ADDRESS'].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full transition-all ${regStep === s ? 'bg-brand-teal w-4' : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              </div>

              {regStep === 'BASIC' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <h3 className="text-xl font-black italic uppercase text-slate-800">Primeiros Passos</h3>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setRole('ADVERTISER')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'ADVERTISER' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-400'}`}>
                      <Building className="inline-block mr-1" size={12} /> Gerador
                    </button>
                    <button type="button" onClick={() => setRole('COLLECTOR')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'COLLECTOR' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-400'}`}>
                      <Truck className="inline-block mr-1" size={12} /> Coletor
                    </button>
                  </div>
                  <input placeholder="Nome ou Empresa" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <button type="button" onClick={handleNextStep} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                    Continuar <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {regStep === 'ROLE_SPECIFIC' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <h3 className="text-xl font-black italic uppercase text-slate-800">Perfil {role === 'ADVERTISER' ? 'Empresarial' : 'Operacional'}</h3>
                  
                  {role === 'ADVERTISER' ? (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Porte da Operação</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['PEQUENA', 'MEDIA', 'GRANDE'] as const).map(p => (
                          <button key={p} onClick={() => setPorteEmpresa(p)} className={`py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${porteEmpresa === p ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-slate-100 text-slate-400'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Modal de Coleta</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setVeiculo('BICICLETA')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${veiculo === 'BICICLETA' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-slate-100 text-slate-400'}`}>
                          <Bike size={20} /> <span className="text-[9px] font-black uppercase">Bike</span>
                        </button>
                        <button onClick={() => setVeiculo('CARROCA')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${veiculo === 'CARROCA' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-slate-100 text-slate-400'}`}>
                          <UserCheck size={20} /> <span className="text-[9px] font-black uppercase">Carroça</span>
                        </button>
                        <button onClick={() => setVeiculo('CARRO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${veiculo === 'CARRO' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-slate-100 text-slate-400'}`}>
                          <Car size={20} /> <span className="text-[9px] font-black uppercase">Carro</span>
                        </button>
                        <button onClick={() => setVeiculo('CAMINHAO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${veiculo === 'CAMINHAO' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-slate-100 text-slate-400'}`}>
                          <Truck size={20} /> <span className="text-[9px] font-black uppercase">Caminhão</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Biografia Profissional</label>
                      <button onClick={generateBioWithAI} disabled={aiGenerating} className="text-[10px] font-black text-brand-teal uppercase flex items-center gap-1 hover:underline disabled:opacity-50">
                        {aiGenerating ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={10} />} Sugerir com IA
                      </button>
                    </div>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24 outline-none focus:border-brand-teal text-sm" placeholder="Fale um pouco sobre seu propósito ambiental..." />
                  </div>

                  <button type="button" onClick={handleNextStep} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                    Confirmar Dados <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {regStep === 'IDENTITY' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 text-brand-teal mb-2">
                    <ShieldCheck size={24} />
                    <h3 className="text-xl font-black italic uppercase text-slate-800">Verificação</h3>
                  </div>
                  {role === 'ADVERTISER' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CNPJ da Empresa</label>
                      <input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF Responsável</label>
                    <input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp de Contato</label>
                    <input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  </div>
                  <button type="button" onClick={handleNextStep} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                    Endereço Operacional <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {regStep === 'ADDRESS' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 text-brand-teal mb-2">
                    <MapPin size={24} />
                    <h3 className="text-xl font-black italic uppercase text-slate-800">Logística</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="CEP" value={cep} onBlur={handleCEPBlur} onChange={e => setCep(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    <input placeholder="Nº" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <input placeholder="Endereço Completo" value={rua} onChange={e => setRua(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    <input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <button type="button" onClick={handleRegister} disabled={loading} className="w-full bg-brand-green text-brand-tealDark py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl shadow-brand-green/20 active:scale-95 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Ativar Conta NUMATU <CheckCircle2 size={18} /></>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
