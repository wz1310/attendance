import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

/**
 * Handle interface to expose internal methods to parent components.
 */
export interface CameraCaptureHandle {
  capture: () => string | null;
}

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  autoCapture?: boolean;
  hideButton?: boolean;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  (
    {
      onCapture,
      label = "Take Photo",
      autoCapture = false,
      hideButton = false,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const activeProcessRef = useRef<boolean>(false);

    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(
      "user"
    );
    const [isStarting, setIsStarting] = useState(false);

    /**
     * Menghentikan semua track kamera dengan aman
     */
    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Paksa reset video element
      }
    }, []);

    /**
     * Menjalankan kamera dengan mekanisme retry dan lock hardware
     */
    const startCamera = useCallback(async () => {
      // Mencegah multiple calls di saat yang bersamaan (penting untuk mobile)
      if (activeProcessRef.current) return;
      activeProcessRef.current = true;

      setIsStarting(true);
      setError(null);

      // 1. Bersihkan sisa-sisa stream sebelumnya
      stopCamera();

      // 2. Jeda singkat (Cooldown) agar hardware kamera dilepaskan oleh sistem operasi
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        // Opsi 1: Constraint Ideal (HD)
        const constraints: MediaStreamConstraints = {
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
          console.warn("Retrying with fallback constraints...");
          // Opsi 2: Fallback paling dasar (Tanpa width/height spesifik)
          // Kadang mobile browser menolak jika resolusi ideal tidak tersedia tepat 1280x720
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        }

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          // Pastikan video mulai diputar
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.error("Video play failed:", playError);
            // Auto-retry jika gagal play (biasanya masalah kebijakan browser)
            videoRef.current.muted = true;
            await videoRef.current.play();
          }
        }
      } catch (err: any) {
        console.error("Fatal Camera Error:", err);
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError("Izin akses kamera ditolak.");
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          setError(
            "Kamera sedang digunakan aplikasi lain atau error hardware."
          );
        } else {
          setError("Gagal menghubungkan ke kamera.");
        }
      } finally {
        setIsStarting(false);
        activeProcessRef.current = false;
      }
    }, [facingMode, stopCamera]);

    /**
     * Switch kamera dengan siklus pembersihan yang benar
     */
    const toggleCamera = () => {
      if (isStarting || activeProcessRef.current) return;
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    /**
     * Capture frame dari video ke canvas
     */
    const capture = useCallback(() => {
      if (videoRef.current && canvasRef.current && streamRef.current) {
        const v = videoRef.current;
        const c = canvasRef.current;

        // Pastikan video sudah memiliki dimensi valid
        if (v.videoWidth === 0 || v.videoHeight === 0) return null;

        c.width = v.videoWidth;
        c.height = v.videoHeight;

        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.save();

          // Mirroring hanya untuk kamera depan
          if (facingMode === "user") {
            ctx.translate(c.width, 0);
            ctx.scale(-1, 1);
          }

          ctx.drawImage(v, 0, 0, c.width, c.height);
          ctx.restore();

          const base64 = c.toDataURL("image/jpeg", 0.85);
          onCapture(base64);
          return base64;
        }
      }
      return null;
    }, [onCapture, facingMode]);

    useImperativeHandle(ref, () => ({
      capture,
    }));

    // Monitor perubahan facingMode
    useEffect(() => {
      startCamera();
      return () => stopCamera();
    }, [facingMode, startCamera, stopCamera]);

    // Handle auto capture
    useEffect(() => {
      if (autoCapture && !isStarting && !error) {
        const interval = setInterval(() => {
          capture();
        }, 1500);
        return () => clearInterval(interval);
      }
    }, [autoCapture, capture, isStarting, error]);

    return (
      <div className="flex flex-col items-center gap-4 w-full relative">
        <div className="relative w-full max-w-md bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] border border-white/5 group">
          {/* Pesan Error di Layer Paling Atas */}
          {error && (
            <div className="absolute inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-[12px] font-black text-white uppercase tracking-wider mb-8 leading-tight max-w-[200px]">
                {error}
              </p>
              <button
                onClick={() => startCamera()}
                className="px-10 py-4 bg-red-500 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-red-900/40 active:scale-95 transition-all"
              >
                Coba Hubungkan Kembali
              </button>
            </div>
          )}

          {/* Video stream layer */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-700 ${
              facingMode === "user" ? "scale-x-[-1]" : "scale-x-1"
            }`}
          />

          {/* Switch Camera Button */}
          <button
            onClick={toggleCamera}
            disabled={isStarting}
            className="absolute top-6 right-6 z-30 bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 text-white/90 hover:bg-indigo-600 active:scale-90 transition-all shadow-2xl disabled:opacity-50"
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

          {/* Loading Overlay */}
          {isStarting && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Interaction Bar */}
          <div className="absolute inset-x-0 bottom-5 flex justify-center z-20">
            {!autoCapture && !hideButton && !error && (
              <button
                onClick={capture}
                disabled={isStarting}
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-2xl transition-all active:scale-90 group/btn disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full border-[3px] border-white group-hover/btn:scale-105 transition-transform"></div>
              </button>
            )}
            {autoCapture && !error && (
              <div className="bg-black/60 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                  AI RECOGNITION ACTIVE
                </span>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
          {label}
        </p>
      </div>
    );
  }
);

export default CameraCapture;
