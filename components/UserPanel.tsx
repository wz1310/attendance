import React, { useState, useEffect } from "react";
import { User, OfficeConfig, AttendanceLog, AppRoute } from "../types";
import { verifyFace, loadModels } from "../services/faceApiService";
import { getDistance, getCurrentPosition } from "../utils/geoUtils";
import CameraCapture from "./CameraCapture";

interface UserPanelProps {
  users: User[];
  config: OfficeConfig;
  onAddLog: (log: AttendanceLog) => void;
  onBack: () => void;
  onViewProfile?: (user: User) => void;
  onLogin?: (user: User) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  users,
  config,
  onAddLog,
  onBack,
  onViewProfile,
  onLogin,
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
        setStatus("login");
      } catch (err) {
        setFeedback("Failed to load AI models.");
        setStatus("error");
      }
    };
    init();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
      if (onLogin) onLogin(user);
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
        setFeedback(`JARAK TERLALU JAUH (${distance.toFixed(0)}m)`);
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
        setFeedback(`BERHASIL ABSEN`);
      } else {
        setStatus("error");
        setFeedback(`WAJAH TIDAK COCOK`);
      }
    } catch (err) {
      setStatus("error");
      setFeedback("GAGAL SENSOR LOKASI");
    }
  };

  const reset = () => {
    setSelectedUser(null);
    setCapturedPhoto(null);
    setStatus("login");
    setFeedback("");
    setLoginId("");
    setLoginPassword("");
    if (onLogin) onLogin(null as any);
  };

  if (status === "loading_models") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
        </div>
      </div>
    );
  }

  // Dynamic Class for Background
  const pageBgClass =
    status === "login"
      ? "bg-[#F8FAFC] text-slate-900"
      : "bg-[#0B0F1A] text-white";

  return (
    <div
      className={`min-h-screen ${pageBgClass} flex flex-col items-center relative overflow-hidden transition-colors duration-700`}
    >
      {/* Background Decorative Mesh - Conditional Color */}
      {status === "login" ? (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full"></div>
        </>
      ) : (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[150px] rounded-full"></div>
        </>
      )}

      <div className="w-full max-w-lg px-6 py-8 z-10">
        <header className="flex items-center justify-between mb-10">
          <button
            onClick={onBack}
            className={`p-3 rounded-2xl border transition-all active:scale-90 ${
              status === "login"
                ? "bg-white border-slate-100 shadow-sm hover:bg-slate-50"
                : "bg-white/5 border-white/5 hover:bg-white/10"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                status === "login" ? "text-slate-400" : "text-slate-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="text-center">
            <h1
              className={`text-sm font-black uppercase tracking-[0.3em] leading-none mb-1 ${
                status === "login" ? "text-indigo-600" : "text-indigo-400"
              }`}
            >
              PRESENCE AI
            </h1>
            <p
              className={`text-[8px] font-black uppercase tracking-[0.15em] ${
                status === "login" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {new Date().toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>

          {/* Spacer to keep title centered since indicator was removed */}
          <div className="w-11"></div>
        </header>

        {status === "login" ? (
          <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="text-center mb-12">
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.3em] mb-2">
                USER LOGIN
              </h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.1em]">
                MASUKKAN KREDENSIAL ABSEN
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1 block">
                  ID PEGAWAI / NAMA
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-[#f4f9ff] border border-[#e2edf9] rounded-[1.75rem] px-6 py-5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400/80 font-bold"
                  placeholder="Contoh: NIK12345"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1 block">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f4f9ff] border border-[#e2edf9] rounded-[1.75rem] px-6 py-5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400/80 font-bold tracking-[0.3em]"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(79,70,229,0.2)] hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 group mt-4"
              >
                MASUK KE ABSENSI
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              {showLoginError && (
                <p className="text-red-500 text-[8px] font-black uppercase text-center mt-4 tracking-widest">
                  Kredensial Tidak Valid
                </p>
              )}
            </form>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-[#161B22]/80 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
              {selectedUser && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative group">
                    <img
                      src={selectedUser.photoBase64}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#161B22] rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-black truncate text-white uppercase tracking-tight leading-none mb-1">
                      {selectedUser.name}
                    </h3>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                      {selectedUser.employeeId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onViewProfile && onViewProfile(selectedUser)
                      }
                      className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase text-indigo-400 transition-all"
                    >
                      PROFIL
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-slate-400 transition-all"
                    >
                      OUT
                    </button>
                  </div>
                </div>
              )}

              {status === "idle" && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.2rem] opacity-20 blur group-hover:opacity-40 transition-all"></div>
                  <div className="relative">
                    <CameraCapture
                      onCapture={handleVerification}
                      label="SISTEM PENGENALAN WAJAH AKTIF"
                      autoCapture={true}
                    />
                  </div>
                </div>
              )}

              {(status === "verifying" ||
                status === "success" ||
                status === "error") && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                  {status === "verifying" ? (
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-white/5 rounded-full"></div>
                      <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center ${
                        status === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(52,211,153,0.2)]"
                          : "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                      }`}
                    >
                      {status === "success" ? (
                        <svg
                          className="w-12 h-12"
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
                      ) : (
                        <svg
                          className="w-12 h-12"
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
                      )}
                    </div>
                  )}
                  <div>
                    <h4
                      className={`text-2xl font-black uppercase tracking-tighter mb-2 ${
                        status === "success"
                          ? "text-emerald-400"
                          : status === "error"
                          ? "text-red-400"
                          : "text-indigo-400"
                      }`}
                    >
                      {status === "success"
                        ? "VERIFIED"
                        : status === "error"
                        ? "FAILED"
                        : "ANALYZING"}
                    </h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[240px] leading-relaxed mx-auto">
                      {feedback}
                    </p>
                  </div>
                  {(status === "success" || status === "error") && (
                    <button
                      onClick={
                        status === "success" ? reset : () => setStatus("idle")
                      }
                      className={`px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                        status === "success"
                          ? "bg-white/5 text-slate-400 hover:bg-white/10"
                          : "bg-indigo-600 text-white shadow-xl shadow-indigo-900/40"
                      }`}
                    >
                      {status === "success" ? "CLOSE" : "TRY AGAIN"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full py-10 text-center mt-auto"></footer>
    </div>
  );
};

export default UserPanel;
