import React, { useState, useEffect } from "react";
import { User, OfficeConfig, AttendanceLog, AppRoute } from "./types";
import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";
import { apiService, getApiBase } from "./services/apiService";

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
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Efek untuk Monitoring Koneksi
  useEffect(() => {
    loadData(); // Load awal

    const interval = setInterval(async () => {
      const healthy = await apiService.checkHealth();
      setIsConnected(healthy);
      if (healthy && users.length === 0) loadData(); // Re-try load jika baru tersambung
    }, 5000);

    return () => clearInterval(interval);
  }, [users.length]);

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
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
      <div
        className={`w-2 h-2 rounded-full animate-pulse ${
          isConnected
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        }`}
      ></div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {isConnected ? "Connected" : "Offline"}
      </span>
    </div>
  );

  if (isLoading && isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.3em]">
            Smart Presence...
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
                Smart System
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
              {!isConnected && (
                <p className="mt-4 text-[8px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
                  Server Unreachable - Local Only
                </p>
              )}
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
