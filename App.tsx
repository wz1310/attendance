import React, { useState, useEffect } from "react";
import { User, OfficeConfig, AttendanceLog, AppRoute } from "./types";
import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";
import {
  apiService,
  getStorageMode,
  setStorageMode,
} from "./services/apiService";
import {
  initFirebase,
  DEFAULT_FIREBASE_CONFIG,
} from "./services/firebaseService";

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LOGIN);
  const [users, setUsers] = useState<User[]>([]);
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig>({
    latitude: -6.2,
    longitude: 106.816666,
    maxDistance: 100,
  });
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeStorage, setActiveStorage] = useState<string>("Detecting...");

  // Fungsi untuk memuat data
  const loadData = async () => {
    try {
      const [fetchedUsers, fetchedConfig, fetchedLogs] = await Promise.all([
        apiService.getUsers(),
        apiService.getConfig(),
        apiService.getLogs(),
      ]);

      setUsers(fetchedUsers || []);
      setOfficeConfig(fetchedConfig);
      setLogs(fetchedLogs || []);
      setIsConnected(true);
    } catch (err) {
      // Jika saat load data gagal, kita asumsikan koneksi bermasalah
      setIsConnected(false);
      throw err;
    }
  };

  // Efek Inisialisasi dan Auto-Switch
  useEffect(() => {
    const bootApp = async () => {
      setIsLoading(true);

      // 1. Cek kesehatan Server Lokal
      const isLocalHealthy = await apiService.checkHealth();

      if (isLocalHealthy) {
        // Jika Server Lokal Aktif, paksa mode ke LOCAL
        setStorageMode("LOCAL");
        setActiveStorage("Server Lokal");
      } else {
        // Jika Server Lokal MATI, beralih ke Firebase
        console.warn(
          "Local server unreachable, switching to Firebase Cloud fallback."
        );
        setStorageMode("FIREBASE");
        setActiveStorage("Firebase Cloud");

        // Pastikan Firebase terinisialisasi dengan config default
        const savedFbConfig = localStorage.getItem("FIREBASE_CONFIG");
        initFirebase(
          savedFbConfig ? JSON.parse(savedFbConfig) : DEFAULT_FIREBASE_CONFIG
        );
      }

      try {
        await loadData();
      } catch (e) {
        console.error("Initial data load failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    bootApp();
  }, []);

  // Monitoring Koneksi berkala
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(async () => {
      const healthy = await apiService.checkHealth();

      // Jika mode saat ini LOCAL tapi server mati, coba beralih ke FIREBASE
      if (!healthy && getStorageMode() === "LOCAL") {
        setStorageMode("FIREBASE");
        setActiveStorage("Firebase Cloud (Auto-failover)");
        initFirebase(null); // Gunakan default
        loadData();
      }
      // Sebaliknya, jika mode saat ini FIREBASE tapi server lokal kembali hidup,
      // kita tetap di FIREBASE atau bisa beralih kembali jika diinginkan.
      // Di sini kita pilih untuk update status koneksi saja agar tidak mengganggu sesi.

      setIsConnected(getStorageMode() === "FIREBASE" ? true : healthy);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleUpdateUsers = async (newUsers: User[]) => {
    try {
      await apiService.saveUsers(newUsers);
      setUsers([...newUsers]);
    } catch (err) {
      alert("Gagal sinkronisasi data.");
    }
  };

  const handleUpdateConfig = async (newConfig: OfficeConfig) => {
    try {
      await apiService.saveConfig(newConfig);
      setOfficeConfig({ ...newConfig });
    } catch (err) {
      alert("Gagal menyimpan konfigurasi.");
    }
  };

  const handleAddLog = async (newLog: AttendanceLog) => {
    if (newLog.status !== "SUCCESS") return;
    try {
      await apiService.addLog(newLog);
      setLogs((prev) => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLogs = async (newLogs: AttendanceLog[]) => {
    try {
      await apiService.updateLogs(newLogs);
      setLogs([...newLogs]);
    } catch (err: any) {
      throw err;
    }
  };

  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-[9999] flex items-center bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-slate-100 group transition-all duration-300 hover:px-3 hover:py-1.5 cursor-help">
      <div
        className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
          isConnected
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        }`}
      ></div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 whitespace-nowrap">
        {isConnected ? `Connected: ${activeStorage}` : "Offline"}
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.3em]">
            Syncing Database...
          </p>
          <p className="text-indigo-400 font-black uppercase text-[7px] tracking-widest mt-2">
            {activeStorage}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LOGIN:
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-[#F1F3F5]">
            <ConnectionStatus />
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-xs border border-slate-100 text-center">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 mb-1 tracking-tighter uppercase">
                Presence
              </h1>
              <p className="text-slate-400 text-[9px] font-black mb-10 tracking-[0.2em] uppercase italic">
                Dual Storage System
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentRoute(AppRoute.ADMIN_PANEL)}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  Admin Portal
                </button>
                <button
                  onClick={() => setCurrentRoute(AppRoute.USER_PANEL)}
                  className="w-full py-3.5 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  Check-in
                </button>
              </div>
              <p className="mt-4 text-[7px] text-slate-400 font-bold uppercase tracking-widest">
                Active: {activeStorage}
              </p>
            </div>
          </div>
        );
      case AppRoute.ADMIN_PANEL:
        return (
          <>
            <ConnectionStatus />
            <AdminPanel
              users={users}
              config={officeConfig}
              logs={logs}
              onUpdateUsers={handleUpdateUsers}
              onUpdateConfig={handleUpdateConfig}
              onUpdateLogs={handleUpdateLogs}
              onBack={() => setCurrentRoute(AppRoute.LOGIN)}
            />
          </>
        );
      case AppRoute.USER_PANEL:
        return (
          <>
            <ConnectionStatus />
            <UserPanel
              users={users}
              config={officeConfig}
              onAddLog={handleAddLog}
              onBack={() => setCurrentRoute(AppRoute.LOGIN)}
            />
          </>
        );
      default:
        return <div className="p-10 text-center">Not Found</div>;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
