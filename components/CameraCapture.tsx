
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  autoCapture?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label = "Take Photo", autoCapture = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Cannot access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
        onCapture(base64);
      }
    }
  }, [onCapture]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efek untuk auto-capture
  useEffect(() => {
    if (autoCapture && stream) {
      const interval = setInterval(() => {
        capture();
      }, 1500); // Cek setiap 1.5 detik
      return () => clearInterval(interval);
    }
  }, [autoCapture, stream, capture]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      ) : (
        <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-white/10">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          
          {/* Scanning Overlay for Auto Mode */}
          {autoCapture && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[1px] border-indigo-500/30"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[scan_2s_linear_infinite]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-48 h-64 border-2 border-indigo-500/20 rounded-[40px] relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>
                 </div>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            {!autoCapture ? (
              <button
                onClick={capture}
                className="bg-white hover:bg-slate-200 text-slate-900 font-bold p-4 rounded-full shadow-lg transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full border-4 border-slate-900 group-hover:bg-slate-900/10 transition-colors"></div>
              </button>
            ) : (
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Scanning Face...</span>
              </div>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(320px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;
