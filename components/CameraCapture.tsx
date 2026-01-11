import React, { useRef, useState, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  autoCapture?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  label = "Take Photo",
  autoCapture = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isStarting, setIsStarting] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);

    // Matikan kamera yang sedang berjalan
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    try {
      // Opsi 1: Coba dengan resolusi ideal
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Gagal dengan resolusi ideal, mencoba mode basic...", e);
        // Opsi 2: Fallback ke pengaturan paling dasar jika opsi 1 gagal
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError(
        "Gagal mengakses kamera. Pastikan izin diberikan dan kamera tidak sedang digunakan aplikasi lain."
      );
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stream, isStarting]);

  const toggleCamera = () => {
    if (isStarting) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current && stream) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Mirror the canvas capture if using front camera
        if (facingMode === "user") {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL("image/jpeg", 0.8);
        onCapture(base64);
      }
    }
  }, [onCapture, facingMode, stream]);

  // Start camera on mount and when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Efek untuk auto-capture
  useEffect(() => {
    if (autoCapture && stream) {
      const interval = setInterval(() => {
        capture();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [autoCapture, stream, capture]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center max-w-sm">
          <svg
            className="w-8 h-8 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-4">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              startCamera();
            }}
            className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-md bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] border border-white/5 group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            /* Mengembalikan ke ukuran semula (scale-1) tanpa zoom-out */
            className={`w-full h-full object-cover transition-transform duration-700 ${
              facingMode === "user" ? "scale-x-[-1]" : "scale-x-1"
            }`}
          />

          {/* Switch Camera Button */}
          <button
            onClick={toggleCamera}
            disabled={isStarting}
            className={`absolute top-6 right-6 z-30 bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 text-white/90 hover:bg-indigo-600 active:scale-90 transition-all shadow-2xl ${
              isStarting ? "opacity-50 cursor-not-allowed" : "opacity-100"
            }`}
            title="Switch Camera"
          >
            <svg
              className={`w-5 h-5 ${isStarting ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 4h5l2 2h5a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 13l2-2 2 2m-2-2v5"
              />
            </svg>
          </button>

          {/* Scanning Overlay for Auto Mode */}
          {autoCapture && !isStarting && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 border-[20px] border-black/20"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[scan_2.5s_ease-in-out_infinite]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-60 border-2 border-white/10 rounded-[3rem] relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator when switching */}
          {isStarting && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                  Switching Lens...
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-5 flex justify-center z-20">
            {!autoCapture ? (
              <button
                onClick={capture}
                disabled={isStarting}
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-2xl transition-all active:scale-90 group/btn disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full border-[3px] border-white group-hover/btn:scale-105 transition-transform"></div>
              </button>
            ) : (
              <div className="bg-black/60 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                  {facingMode === "user"
                    ? "Face Recognition Active"
                    : "Object Scanning Active"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-center gap-2 opacity-50">
        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
          {label}
        </p>
        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(350px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;
