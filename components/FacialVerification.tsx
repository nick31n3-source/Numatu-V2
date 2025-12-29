
import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, RefreshCcw, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface FacialVerificationProps {
  onVerified: (photo: string) => void;
  userName: string;
}

const FacialVerification: React.FC<FacialVerificationProps> = ({ onVerified, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CAMERA_ACTIVE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();
      setStatus('IDLE');
      setError(null);
      
      const constraints = { 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => setStatus('CAMERA_ACTIVE')).catch(() => setError("Erro ao iniciar fluxo de vídeo."));
        };
      }
    } catch (err: any) {
      setError("Permissão de câmera negada. Ative-a nas configurações do navegador.");
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    // Verificação de segurança da API KEY antes de tentar chamar a IA
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("Configuração pendente: API_KEY não encontrada nas variáveis de ambiente.");
      return;
    }

    setIsScanning(true);
    setStatus('PROCESSING');
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Captura um quadro quadrado centralizado
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Falha no contexto do Canvas");
      
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6);
      const base64Data = base64Image.split(',')[1];

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Analise esta imagem. Existe um rosto humano frontal, nítido e visível? Responda estritamente apenas 'VERIFIED' ou 'FAIL'." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        },
        config: {
          temperature: 0.1, // Baixa temperatura para resposta mais determinística
        }
      });

      const result = response.text?.trim().toUpperCase();

      if (result?.includes('VERIFIED')) {
        setStatus('SUCCESS');
        setTimeout(() => {
          onVerified(base64Image);
          stopCamera();
        }, 1500);
      } else {
        setError("Rosto não reconhecido. Certifique-se de estar em um local iluminado.");
        setStatus('CAMERA_ACTIVE');
      }
    } catch (err: any) {
      console.error("Erro Facial:", err);
      // Erro 403 ou 400 geralmente indicam problema na chave
      if (err.message?.includes('403') || err.message?.includes('API key')) {
        setError("Chave de API Inválida ou Bloqueada. Revise no Google AI Studio.");
      } else {
        setError("Falha de conexão com o servidor de IA. Tente novamente em instantes.");
      }
      setStatus('CAMERA_ACTIVE');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 pattern-grid-lg">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-brand-tealDark p-8 text-white text-center relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 rounded-full blur-2xl"></div>
          <ShieldCheck className="mx-auto mb-2 text-brand-green" size={40} />
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Biometria de Segurança</h2>
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Identidade Validada por IA</p>
        </div>

        <div className="p-10 flex flex-col items-center gap-8">
          <div className="relative w-64 h-64 rounded-[3rem] border-8 border-slate-100 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
            {status === 'SUCCESS' ? (
              <div className="flex flex-col items-center animate-in zoom-in">
                <CheckCircle2 size={80} className="text-brand-green" />
                <p className="text-[10px] font-black text-brand-green uppercase mt-4">Identificado!</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover grayscale-[0.3] transition-opacity duration-500 ${status === 'PROCESSING' ? 'opacity-20' : 'opacity-100'}`} 
                />
                {status === 'CAMERA_ACTIVE' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-brand-green/40 border-dashed rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-green/10 to-transparent w-full h-1/2 animate-scan opacity-40"></div>
                  </div>
                )}
                {(status === 'IDLE' || isScanning) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                    <RefreshCcw className="text-white animate-spin mb-2" size={32} />
                    <p className="text-[8px] font-black text-white uppercase tracking-widest">Processando...</p>
                  </div>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="text-center space-y-5 w-full">
            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 inline-block">
               <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest leading-none">Parceiro: <span className="text-brand-teal">{userName}</span></h3>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-left leading-tight">Falha na Verificação</span>
                </div>
                <p className="text-[9px] text-red-500 font-medium text-left leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              onClick={captureAndVerify}
              disabled={status !== 'CAMERA_ACTIVE' || isScanning}
              className="group relative w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-brand-teal transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Scan size={18} className="group-hover:rotate-90 transition-transform" />
              {isScanning ? 'Analisando Bio...' : 'Confirmar Presença'}
            </button>
            
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Posicione seu rosto no centro do quadro</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan { 
          0% { transform: translateY(-100%); } 
          100% { transform: translateY(200%); } 
        }
        .animate-scan { animation: scan 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FacialVerification;
