
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
          width: { ideal: 480 }, 
          height: { ideal: 480 } 
        } 
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => setStatus('CAMERA_ACTIVE')).catch(() => setError("Toque na tela para ativar vídeo."));
        };
      }
    } catch (err: any) {
      setError("Permissão de câmera negada. Ative-a nas configurações.");
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    setIsScanning(true);
    setStatus('PROCESSING');
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = 300; // Resolução otimizada para biometria
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      
      ctx.drawImage(video, 0, 0, 300, 300);
      const base64Image = canvas.toDataURL('image/jpeg', 0.4); // Alta compressão para poupar DB
      const base64Data = base64Image.split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Verificação: Existe um rosto humano visível? Responda 'VERIFIED' ou 'FAIL'." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }
      });

      const result = response.text?.trim().toUpperCase();

      if (result?.includes('VERIFIED')) {
        setStatus('SUCCESS');
        setTimeout(() => {
          onVerified(base64Image);
          stopCamera();
        }, 1200);
      } else {
        setError("Rosto não detectado ou imagem escura. Tente novamente.");
        setStatus('CAMERA_ACTIVE');
      }
    } catch (err) {
      setError("Erro no motor de IA. Verifique sua conexão.");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-brand-tealDark p-8 text-white text-center">
          <ShieldCheck className="mx-auto mb-2 text-brand-green" size={40} />
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Biometria de Segurança</h2>
        </div>

        <div className="p-10 flex flex-col items-center gap-6">
          <div className="relative w-64 h-64 rounded-full border-8 border-slate-100 overflow-hidden bg-slate-900 flex items-center justify-center">
            {status === 'SUCCESS' ? (
              <CheckCircle2 size={80} className="text-brand-green animate-bounce" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover grayscale-[0.2] ${status === 'PROCESSING' ? 'opacity-30' : 'opacity-100'}`} />
                {status === 'CAMERA_ACTIVE' && (
                  <div className="absolute inset-0 border-4 border-brand-green/30 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-full h-[2px] bg-brand-green/50 animate-scan"></div>
                  </div>
                )}
                {(status === 'IDLE' || isScanning) && (
                  <RefreshCcw className="text-white animate-spin absolute" size={32} />
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="text-center space-y-4 w-full">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Parceiro: {userName}</h3>
            {error && <p className="text-[10px] text-red-500 font-bold uppercase p-3 bg-red-50 rounded-xl">{error}</p>}
            <button 
              onClick={captureAndVerify}
              disabled={status !== 'CAMERA_ACTIVE' || isScanning}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-30"
            >
              <Scan size={18} />
              {isScanning ? 'Verificando...' : 'Confirmar Presença'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan { 0% { transform: translateY(-100px); } 100% { transform: translateY(100px); } }
        .animate-scan { animation: scan 2s linear infinite alternate; }
      `}</style>
    </div>
  );
};

export default FacialVerification;
