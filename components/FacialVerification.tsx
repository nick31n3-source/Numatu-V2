
import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, RefreshCcw, AlertCircle, CheckCircle2, Scan, Camera, UserCircle2, User as UserIcon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface FacialVerificationProps {
  onVerified: (photo: string, gender: 'M' | 'F' | 'O') => void;
  userName: string;
}

const FacialVerification: React.FC<FacialVerificationProps> = ({ onVerified, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CAMERA_ACTIVE' | 'PROCESSING' | 'CONFIRM_GENDER' | 'SUCCESS'>('IDLE');
  
  const [detectedGender, setDetectedGender] = useState<'M' | 'F' | 'O' | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

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
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        setStatus('CAMERA_ACTIVE');
      }
    } catch (err: any) {
      setError("Câmera bloqueada ou não encontrada. Verifique as permissões.");
      setStatus('IDLE');
    }
  };

  // Fix: use the recommended content structure (Content[]) for generateContent
  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    setIsScanning(true);
    setStatus('PROCESSING');
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = 400; canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      ctx.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, 400, 400);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedPhoto(base64Image);
      const base64Data = base64Image.split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { text: "Analise esta selfie. Primeiro: Existe um rosto visível? Segundo: Qual o gênero provável da pessoa (M ou F)? Responda no formato estrito: RESULT:[VERIFIED/FAIL]|GENDER:[M/F/O]. Se não houver rosto, responda RESULT:FAIL." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }],
        config: { temperature: 0.1 }
      });

      const resultStr = response.text?.trim().toUpperCase() || '';
      if (resultStr.includes('VERIFIED')) {
        const genderMatch = resultStr.match(/GENDER:([MFO])/);
        const gender = (genderMatch ? genderMatch[1] : 'O') as 'M' | 'F' | 'O';
        setDetectedGender(gender);
        setStatus('CONFIRM_GENDER');
      } else {
        setError("Rosto não detectado. Centralize sua selfie e garanta boa luz.");
        setStatus('CAMERA_ACTIVE');
      }
    } catch (err: any) {
      setError("Erro ao processar biometria facial.");
      setStatus('CAMERA_ACTIVE');
    } finally {
      setIsScanning(false);
    }
  };

  const finalizeVerification = (confirmedGender: 'M' | 'F' | 'O') => {
    setStatus('SUCCESS');
    setTimeout(() => {
      onVerified(capturedPhoto!, confirmedGender);
      stopCamera();
    }, 1000);
  };

  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-brand-tealDark p-8 text-white text-center">
          <ShieldCheck className="mx-auto mb-2 text-brand-green" size={40} />
          <h2 className="text-lg font-black uppercase italic">Face ID - NUMATU</h2>
        </div>

        <div className="p-10 flex flex-col items-center gap-8 bg-white">
          <div className="relative w-64 h-64 rounded-[3rem] border-8 border-slate-50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
            {status === 'CONFIRM_GENDER' && capturedPhoto ? (
              <img src={capturedPhoto} className="w-full h-full object-cover animate-in zoom-in" />
            ) : status === 'SUCCESS' ? (
              <CheckCircle2 size={80} className="text-brand-green animate-in zoom-in" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover grayscale-[0.2] ${status === 'PROCESSING' ? 'opacity-30' : ''}`} />
            )}
            
            {status === 'PROCESSING' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <RefreshCcw className="text-white animate-spin mb-3" size={32} />
                <p className="text-[9px] font-black text-white uppercase tracking-widest">IA Analisando Gênero...</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {status === 'CONFIRM_GENDER' ? (
            <div className="text-center space-y-6 w-full animate-in slide-in-from-bottom-4">
              <div className="bg-brand-teal/5 p-4 rounded-3xl border border-brand-teal/20">
                <p className="text-xs font-bold text-slate-600">Detectamos um perfil:</p>
                <h3 className="text-xl font-black text-brand-tealDark uppercase mt-1">
                  {detectedGender === 'M' ? 'MASCULINO' : detectedGender === 'F' ? 'FEMININO' : 'NÃO BINÁRIO'}
                </h3>
                <p className="text-[9px] text-slate-400 mt-1">Isso está correto?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => finalizeVerification(detectedGender!)} className="bg-brand-green text-brand-tealDark py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Sim, sou eu</button>
                <button onClick={() => setStatus('CAMERA_ACTIVE')} className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px]">Não, repetir</button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 w-full">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold">{error}</div>}
              <button 
                onClick={captureAndVerify}
                disabled={status !== 'CAMERA_ACTIVE' || isScanning}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-30"
              >
                <Scan size={20} /> Capturar Biometria
              </button>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Centralize seu rosto para validação de gênero</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacialVerification;
