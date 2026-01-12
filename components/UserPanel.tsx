import React, { useState, useEffect } from "react";
import { User, OfficeConfig, AttendanceLog } from "../types";
import { verifyFace, loadModels } from "../services/faceApiService";
import { getDistance, getCurrentPosition } from "../utils/geoUtils";
import CameraCapture from "./CameraCapture";

interface UserPanelProps {
  users: User[];
  config: OfficeConfig;
  onAddLog: (log: AttendanceLog) => void;
  onBack: () => void;
  onViewProfile?: (user: User) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  users,
  config,
  onAddLog,
  onBack,
  onViewProfile,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading_models" | "idle" | "verifying" | "success" | "error" | "login"
  >("loading_models");
  const [feedback, setFeedback] = useState<string>("");
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);

  // Login States
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginError, setShowLoginError] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setStatus("login"); // Start at login
      } catch (err) {
        setFeedback("Failed to load AI models.");
        setStatus("error");
      }
    };
    init();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Cari user berdasarkan Name ATAU Employee ID (NIK)
    const user = users.find(
      (u) =>
        (u.employeeId === loginId ||
          u.name.toLowerCase() === loginId.toLowerCase()) &&
        u.password === loginPassword
    );

    if (user) {
      setSelectedUser(user);
      setStatus("idle");
      setFeedback("");
      setShowLoginError(false);
    } else {
      setShowLoginError(true);
    }
  };

  const handleVerification = async (photo: string) => {
    if (!selectedUser || status === "verifying" || status === "success") return;

    setCapturedPhoto(photo);
    setStatus("verifying");
    setFeedback("Mengecek Lokasi...");

    try {
      const position = await getCurrentPosition();
      const distance = getDistance(
        position.coords.latitude,
        position.coords.longitude,
        config.latitude,
        config.longitude
      );
      setCurrentDistance(distance);

      if (distance > config.maxDistance) {
        setStatus("error");
        setFeedback(
          `Jarak terlalu jauh (${distance.toFixed(0)}m). Maksimal ${
            config.maxDistance
          }m.`
        );
        return;
      }

      setFeedback("Menganalisis Wajah...");
      const verification = await verifyFace(selectedUser.photoBase64, photo);

      if (verification.isMatch) {
        const successLog: AttendanceLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: selectedUser.employeeId,
          userName: selectedUser.name,
          timestamp: Date.now(),
          status: "SUCCESS",
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          distance: distance,
          capturedPhoto: photo,
        };
        onAddLog(successLog);
        setStatus("success");
        setFeedback(`Absensi Berhasil! Halo ${selectedUser.name}.`);
      } else {
        setStatus("error");
        setFeedback(`Wajah tidak sesuai. Pastikan wajah terlihat jelas.`);
      }
    } catch (err) {
      setStatus("error");
      setFeedback("Gagal mengakses data lokasi atau sensor.");
    }
  };

  const reset = () => {
    setSelectedUser(null);
    setCapturedPhoto(null);
    setStatus("login");
    setFeedback("");
    setLoginId("");
    setLoginPassword("");
    setCurrentDistance(null);
  };

  if (status === "loading_models") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">
            Loading AI Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 flex flex-col items-center">
      {/* LOGIN ERROR WIDGET */}
      {showLoginError && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setShowLoginError(false)}
          ></div>
          <div className="bg-slate-800 rounded-[2rem] p-8 shadow-2xl relative w-full max-sm border border-white/5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-500 animate-pulse"
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
            <h3 className="text-xl font-black text-slate-100 text-center uppercase tracking-tighter leading-none mb-2">
              Akses Ditolak
            </h3>
            <p className="text-slate-500 text-[10px] text-center mb-8 font-bold uppercase tracking-widest leading-relaxed">
              ID atau Password salah.
              <br />
              Silakan periksa kembali data Anda.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowLoginError(false)}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={onBack}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div className="text-right">
            <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">
              Presence AI
            </h1>
            <p className="text-slate-500 text-[9px] uppercase font-black">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </header>

        {status === "login" ? (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h2 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                User Login
              </h2>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                Masukkan Kredensial Absen
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                  ID Pegawai / Nama
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Contoh: NIK12345"
                  required
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                Masuk ke Absensi
              </button>
            </form>

            <p className="text-center mt-8 text-slate-500 text-[8px] font-bold uppercase tracking-widest leading-relaxed">
              Data login dikelola oleh Admin.
              <br />
              Lupa password? Hubungi HRD.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-white/10 shadow-2xl">
              {selectedUser && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <img
                      src={selectedUser.photoBase64}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-slate-100">
                      {selectedUser.name}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      {selectedUser.employeeId}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() =>
                        onViewProfile && onViewProfile(selectedUser)
                      }
                      className="text-white text-[9px] uppercase font-black bg-indigo-600/20 hover:bg-indigo-600/40 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
                    >
                      Profil
                    </button>
                    <button
                      onClick={reset}
                      className="text-slate-400 hover:text-white text-[9px] uppercase font-black bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Out
                    </button>
                  </div>
                </div>
              )}

              {status === "idle" && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                  <CameraCapture
                    onCapture={handleVerification}
                    label="Posisikan wajah Anda di tengah kotak"
                    autoCapture={true}
                  />
                </div>
              )}

              {status === "verifying" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/10 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                  </div>
                  <p className="text-xs font-black uppercase text-indigo-400 animate-pulse tracking-widest">
                    {feedback}
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="py-8 text-center space-y-6 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/5">
                    <svg
                      className="w-10 h-10 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-green-400 uppercase italic tracking-tighter">
                      SUCCESS!
                    </h4>
                    <p className="text-slate-300 text-[11px] font-medium max-w-[200px] mx-auto leading-relaxed">
                      {feedback}
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="px-10 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Selesai
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="py-8 text-center space-y-6 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-500/5">
                    <svg
                      className="w-10 h-10 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-red-400 uppercase italic tracking-tighter">
                      FAILED
                    </h4>
                    <p className="text-slate-300 text-[11px] px-6 font-medium leading-relaxed">
                      {feedback}
                    </p>
                  </div>
                  <button
                    onClick={() => setStatus("idle")}
                    className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>

            {(status === "verifying" ||
              status === "success" ||
              status === "error") &&
              capturedPhoto &&
              selectedUser && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] uppercase text-slate-500 mb-1.5 font-black tracking-widest">
                      Master ID
                    </p>
                    <img
                      src={selectedUser.photoBase64}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg ring-1 ring-white/5"
                    />
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] uppercase text-slate-500 mb-1.5 font-black tracking-widest">
                      Realtime Capture
                    </p>
                    <img
                      src={capturedPhoto}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg ring-1 ring-white/5"
                    />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPanel;
