import React, { useState, useEffect } from "react";
import {
  User,
  OfficeConfig,
  AttendanceLog,
  AppRoute,
  LeaveRequest,
  FeedPost,
} from "./types";
import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";
import LeavePanel from "./components/LeavePanel";
import OrgChart from "./components/OrgChart";
import UserProfile from "./components/UserProfile";
import Feeds from "./components/Feeds";
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
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [feeds, setFeeds] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeStorage, setActiveStorage] = useState<string>("Detecting...");
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Admin Login States
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const loadData = async () => {
    try {
      const [
        fetchedUsers,
        fetchedConfig,
        fetchedLogs,
        fetchedLeaves,
        fetchedFeeds,
      ] = await Promise.all([
        apiService.getUsers(),
        apiService.getConfig(),
        apiService.getLogs(),
        apiService.getLeaveRequests
          ? apiService.getLeaveRequests()
          : Promise.resolve([]),
        apiService.getFeeds ? apiService.getFeeds() : Promise.resolve([]),
      ]);

      setUsers(fetchedUsers || []);
      setOfficeConfig(fetchedConfig);
      setLogs(fetchedLogs || []);
      setLeaveRequests(fetchedLeaves || []);
      setFeeds(fetchedFeeds || []);
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      throw err;
    }
  };

  useEffect(() => {
    const bootApp = async () => {
      setIsLoading(true);
      const isLocalHealthy = await apiService.checkHealth();

      if (isLocalHealthy) {
        setStorageMode("LOCAL");
        setActiveStorage("Server Lokal");
      } else {
        setStorageMode("FIREBASE");
        setActiveStorage("Firebase Cloud");
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

  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(async () => {
      const healthy = await apiService.checkHealth();
      if (!healthy && getStorageMode() === "LOCAL") {
        setStorageMode("FIREBASE");
        setActiveStorage("Firebase Cloud (Auto-failover)");
        initFirebase(null);
        loadData();
      }
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

  const handleUpdateLeaves = async (newLeaves: LeaveRequest[]) => {
    try {
      await apiService.updateLeaveRequests(newLeaves);
      setLeaveRequests([...newLeaves]);
    } catch (err) {
      alert("Gagal memperbarui pengajuan.");
    }
  };

  const handleAddFeed = async (post: FeedPost) => {
    try {
      await apiService.addFeed(post);
      setFeeds((prev) => [post, ...prev]);
    } catch (err) {
      alert("Gagal mengirim postingan.");
    }
  };

  const handleRefreshFeeds = async () => {
    try {
      const fetchedFeeds = await apiService.getFeeds();
      setFeeds(fetchedFeeds || []);
    } catch (err) {
      console.error("Gagal refresh feeds dari database", err);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    const adminUser = users.find(
      (u) =>
        (u.employeeId === adminId ||
          u.name.toLowerCase() === adminId.toLowerCase()) &&
        u.password === adminPassword
    );
    if (adminUser) {
      if (adminUser.role === "admin") {
        setCurrentRoute(AppRoute.ADMIN_PANEL);
        setAdminId("");
        setAdminPassword("");
      } else {
        setAdminError("Akses ditolak. Anda bukan Admin.");
      }
    } else {
      setAdminError("ID atau Password salah.");
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

  const BottomNav = () => {
    if (
      !activeUser ||
      [AppRoute.LOGIN, AppRoute.ADMIN_LOGIN, AppRoute.ADMIN_PANEL].includes(
        currentRoute
      )
    )
      return null;

    return (
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between z-50">
        <button
          onClick={() => setCurrentRoute(AppRoute.USER_PANEL)}
          className={`flex flex-col items-center gap-1 ${
            currentRoute === AppRoute.USER_PANEL
              ? "text-indigo-600"
              : "text-slate-400"
          }`}
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
              strokeWidth="2.5"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">
            Home
          </span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">
            Features
          </span>
        </button>
        <button
          onClick={() => setCurrentRoute(AppRoute.FEEDS)}
          className={`flex flex-col items-center gap-1 ${
            currentRoute === AppRoute.FEEDS
              ? "text-indigo-600"
              : "text-slate-400"
          }`}
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
              strokeWidth="2.5"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">
            Feeds
          </span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">
            Work
          </span>
        </button>
        <button
          onClick={() => setCurrentRoute(AppRoute.PROFILE)}
          className={`flex flex-col items-center gap-1 ${
            currentRoute === AppRoute.PROFILE
              ? "text-indigo-600"
              : "text-slate-400"
          }`}
        >
          <img
            src={activeUser ? activeUser.photoBase64 : ""}
            className="w-5 h-5 rounded-full object-cover ring-2 ring-transparent"
            alt=""
          />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Profile
          </span>
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LOGIN:
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
            <ConnectionStatus />
            <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl w-full max-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>

              <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">
                HR SYSTEM
              </h1>
              <p className="text-slate-400 text-[10px] font-black mb-12 tracking-[0.3em] uppercase opacity-50">
                Unified Enterprise Solution
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentRoute(AppRoute.ADMIN_LOGIN)}
                  className="col-span-1 py-6 bg-white border-2 border-slate-100 hover:border-indigo-200 hover:bg-slate-50 rounded-3xl shadow-sm transition-all active:scale-95 group"
                >
                  <div className="text-indigo-600 mb-2 flex justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20c4.478 0 8.268-2.943 9.542-7-1.274-4.057-5.064-7-9.542-7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <span className="font-black uppercase tracking-widest text-[10px] text-slate-700">
                    Admin Portal
                  </span>
                </button>
                <button
                  onClick={() => setCurrentRoute(AppRoute.LEAVE_PANEL)}
                  className="col-span-1 py-6 bg-white border-2 border-slate-100 hover:border-indigo-200 hover:bg-slate-50 rounded-3xl shadow-sm transition-all active:scale-95 group"
                >
                  <div className="text-indigo-600 mb-2 flex justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-black uppercase tracking-widest text-[10px] text-slate-700">
                    Pengajuan
                  </span>
                </button>
                <button
                  onClick={() => setCurrentRoute(AppRoute.USER_PANEL)}
                  className="col-span-2 py-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
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
                      strokeWidth="3"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-black uppercase tracking-widest text-[11px]">
                    Check-In Presence
                  </span>
                </button>
              </div>

              <div className="mt-12 flex flex-col items-center gap-1">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em]">
                  Active Engine
                </p>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                  {activeStorage}
                </p>
              </div>
            </div>
          </div>
        );

      case AppRoute.ADMIN_LOGIN:
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <ConnectionStatus />
            <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-sm border border-white/5 animate-in zoom-in-95">
              <button
                onClick={() => {
                  setCurrentRoute(AppRoute.LOGIN);
                  setAdminError("");
                }}
                className="mb-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-all"
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <svg
                    className="w-8 h-8 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                  Admin Access
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Verifikasi Hak Akses Portal
                </p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Username Admin"
                  required
                />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                  required
                />
                {adminError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    <p className="text-red-400 text-[9px] font-bold uppercase text-center">
                      {adminError}
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-900/20"
                >
                  Buka Portal Admin
                </button>
              </form>
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
              leaveRequests={leaveRequests}
              onUpdateUsers={handleUpdateUsers}
              onUpdateConfig={handleUpdateConfig}
              onUpdateLogs={handleUpdateLogs}
              onUpdateLeaves={handleUpdateLeaves}
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
              onViewProfile={(user) => {
                setActiveUser(user);
                setCurrentRoute(AppRoute.PROFILE);
              }}
            />
            <BottomNav />
          </>
        );
      case AppRoute.LEAVE_PANEL:
        return (
          <>
            <ConnectionStatus />
            <LeavePanel
              users={users}
              leaveRequests={leaveRequests}
              onUpdateLeaves={handleUpdateLeaves}
              onBack={() => setCurrentRoute(AppRoute.LOGIN)}
              onViewProfile={(user) => {
                setActiveUser(user);
                setCurrentRoute(AppRoute.PROFILE);
              }}
            />
          </>
        );
      case AppRoute.FEEDS:
        return (
          <>
            <ConnectionStatus />
            {activeUser && (
              <Feeds
                user={activeUser}
                posts={feeds}
                onAddPost={handleAddFeed}
                onRefresh={handleRefreshFeeds}
              />
            )}
            <BottomNav />
          </>
        );
      case AppRoute.PROFILE:
        return (
          <>
            <ConnectionStatus />
            {activeUser && (
              <UserProfile
                user={activeUser}
                leaveRequests={leaveRequests}
                attendanceLogs={logs}
                onBack={() => setCurrentRoute(AppRoute.LOGIN)}
              />
            )}
            <BottomNav />
          </>
        );
      default:
        return <div className="p-10 text-center">Not Found</div>;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
