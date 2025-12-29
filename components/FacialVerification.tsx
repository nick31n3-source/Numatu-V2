
import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, RefreshCcw, AlertCircle, CheckCircle2, Scan, Camera } from 'lucide-react';
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
        // Removido o listener complexo para garantir que o play ocorra de forma mais direta
        try {
          await videoRef.current.play();
          setStatus('CAMERA_ACTIVE');
        } catch (playErr) {
          console.error("Erro ao dar play no vídeo:", playErr);
          setError("Clique no vídeo para iniciar a câmera caso ela não carregue.");
          setStatus('CAMERA_ACTIVE');
        }
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setError("Permissão de câmera negada ou dispositivo não encontrado. Verifique as permissões do navegador.");
      setStatus('IDLE');
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("Configuração pendente: API_KEY ausente.");
      return;
    }

    setIsScanning(true);
    setStatus('PROCESSING');
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
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
          temperature: 0.1,
        }
      });

      const result = response.text?.trim().toUpperCase() || '';

      if (result.includes('VERIFIED')) {
        setStatus('SUCCESS');
        setTimeout(() => {
          onVerified(base64Image);
          stopCamera();
        }, 1500);
      } else {
        setError("Rosto não detectado com clareza. Centralize seu rosto e verifique a iluminação.");
        setStatus('CAMERA_ACTIVE');
      }
    } catch (err: any) {
      console.error("Erro Facial:", err);
      setError("Falha na comunicação com o servidor de IA. Tente novamente.");
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
    <div className="fixed inset-0 z-[500] bg-slate-100 flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header Sólido para evitar transparências estranhas */}
        <div className="bg-brand-tealDark p-8 text-white text-center">
          <ShieldCheck className="mx-auto mb-2 text-brand-green" size={40} />
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Biometria de Segurança</h2>
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Validação Obrigatória</p>
        </div>

        <div className="p-10 flex flex-col items-center gap-8 bg-white">
          {/* Container do Vídeo */}
          <div className="relative w-64 h-64 rounded-[3rem] border-8 border-slate-50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner group">
            {status === 'SUCCESS' ? (
              <div className="flex flex-col items-center animate-in zoom-in">
                <CheckCircle2 size={80} className="text-brand-green" />
                <p className="text-[10px] font-black text-brand-green uppercase mt-4">Sucesso!</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover grayscale-[0.2] transition-opacity duration-500 ${status === 'PROCESSING' ? 'opacity-30' : 'opacity-100'}`} 
                />
                
                {status === 'CAMERA_ACTIVE' && !isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-brand-green/30 border-dashed rounded-full animate-[spin_8s_linear_infinite]"></div>
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-brand-green/30 animate-pulse"></div>
                  </div>
                )}

                {(status === 'IDLE' || isScanning) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <RefreshCcw className="text-white animate-spin mb-3" size={32} />
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">
                      {isScanning ? 'Analisando Identidade...' : 'Iniciando Câmera...'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="text-center space-y-6 w-full">
            <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 inline-flex flex-col gap-1">
               <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Identificando Parceiro</span>
               <h3 className="font-black text-slate-800 text-xs uppercase tracking-tighter italic">{userName}</h3>
            </div>
            
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-3xl animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase">Atenção</span>
                </div>
                <p className="text-[10px] text-red-500 font-bold leading-relaxed text-left">{error}</p>
                {status === 'IDLE' && (
                  <button onClick={startCamera} className="mt-4 text-[10px] font-black text-brand-teal uppercase flex items-center gap-2 mx-auto">
                    <Camera size={12} /> Tentar Reconectar Câmera
                  </button>
                )}
              </div>
            )}

            <button 
              onClick={captureAndVerify}
              disabled={status !== 'CAMERA_ACTIVE' || isScanning}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl hover:bg-brand-teal transition-all active:scale-95 disabled:opacity-30"
            >
              <Scan size={20} />
              {isScanning ? 'Processando IA...' : 'Confirmar Presença'}
            </button>
            
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              Posicione seu rosto dentro do círculo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacialVerification;
