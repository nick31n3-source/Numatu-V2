
import React, { useState } from 'react';
import { Leaf, Mail, Lock, ArrowRight, UserPlus, ArrowLeft, AlertCircle, Phone, User as UserIcon, ShieldCheck, CheckCircle2, Key, RefreshCw, MapPin } from 'lucide-react';
import { UserRole, User } from '../types';
import { DatabaseService } from '../database';

type AuthMode = 'LOGIN' | 'REGISTER';
type RegisterStep = 'BASIC' | 'IDENTITY' | 'ADDRESS';

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

const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [regStep, setRegStep] = useState<RegisterStep>('BASIC');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('ADVERTISER');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const resetError = () => setError(null);

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
    resetError();
    try {
      const users = await DatabaseService.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError("Credenciais inválidas ou conta não encontrada.");
      }
    } catch (err) {
      setError("Houve uma falha técnica no acesso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    resetError();
    if (regStep === 'BASIC') {
      if (!name || !email || !password) return setError("Preencha todos os campos fundamentais.");
      if (password.length < 3) return setError("A senha deve ser mais forte.");
      setRegStep('IDENTITY');
    } else if (regStep === 'IDENTITY') {
      if (!isValidCPF(cpf)) return setError("Formato de CPF inválido.");
      if (phone.replace(/\D/g, '').length < 10) return setError("Informe um número de telefone real.");
      setRegStep('ADDRESS');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rua || !numero || !cep) return setError("Endereço é vital para a logística NUMATU.");
    
    setLoading(true);
    resetError();

    try {
      const newUser: User = {
        id: `USR-${Math.random().toString(36).substr(2, 9)}`,
        username: email.split('@')[0],
        email: email.toLowerCase(),
        password,
        name,
        role,
        isProfileComplete: true,
        isActive: true,
        email_verificado: true,
        telefone_verificado: true,
        cpf_verificado: true,
        endereco_verificado: true,
        face_verified: false,
        telefone: phone.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, ''),
        cep, rua, numero, bairro, cidade, estado
      };

      await DatabaseService.saveUser(newUser);
      onLogin(newUser);
    } catch (err: any) {
      setError(err.message || "Erro inesperado no cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pattern-grid-lg">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-brand-tealDark p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
              <Leaf size={32} className="text-brand-green fill-brand-green" />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">NUMATU</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mt-1">Soberania Circular</p>
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
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Usuário Digital</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal transition-all" placeholder="nome@exemplo.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Código de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal transition-all" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-teal transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Entrar Agora <ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={() => {setMode('REGISTER'); resetError();}} className="w-full mt-4 text-[10px] font-black uppercase text-brand-teal tracking-widest hover:underline flex items-center justify-center gap-2">
                <UserPlus size={14} /> Ainda não sou parceiro NUMATU
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => regStep === 'BASIC' ? setMode('LOGIN') : setRegStep(regStep === 'IDENTITY' ? 'BASIC' : 'IDENTITY')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${regStep === 'BASIC' ? 'bg-brand-teal' : 'bg-slate-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${regStep === 'IDENTITY' ? 'bg-brand-teal' : 'bg-slate-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${regStep === 'ADDRESS' ? 'bg-brand-teal' : 'bg-slate-200'}`}></div>
                </div>
              </div>

              {regStep === 'BASIC' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <h3 className="text-xl font-black italic uppercase text-slate-800">Início de Parceria</h3>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setRole('ADVERTISER')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'ADVERTISER' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-400'}`}>Anunciante</button>
                    <button type="button" onClick={() => setRole('COLLECTOR')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'COLLECTOR' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-400'}`}>Coletor</button>
                  </div>
                  <input placeholder="Nome ou Razão Social" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <input placeholder="Criar Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <button type="button" onClick={handleNextStep} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                    Validar Identidade <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {regStep === 'IDENTITY' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 text-brand-teal mb-2">
                    <ShieldCheck size={24} />
                    <h3 className="text-xl font-black italic uppercase text-slate-800">Dados Civis</h3>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF (Pessoa Física)</label>
                    <div className="relative">
                      <Key className={`absolute left-4 top-1/2 -translate-y-1/2 ${isValidCPF(cpf) ? 'text-brand-green' : 'text-slate-300'}`} size={18} />
                      <input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                      {isValidCPF(cpf) && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-green" size={18} />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Celular / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                    </div>
                  </div>
                  <button type="button" onClick={handleNextStep} className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                    Dados Logísticos <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {regStep === 'ADDRESS' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 text-brand-teal mb-2">
                    <MapPin size={24} />
                    <h3 className="text-xl font-black italic uppercase text-slate-800">Endereço de Operação</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="CEP" value={cep} onBlur={handleCEPBlur} onChange={e => setCep(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                    <input placeholder="Número" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  </div>
                  <input placeholder="Rua / Logradouro" value={rua} onChange={e => setRua(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-teal" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    <input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <button type="button" onClick={handleRegister} disabled={loading} className="w-full bg-brand-green text-brand-tealDark py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Concluir Registro <CheckCircle2 size={18} /></>}
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
