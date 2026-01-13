import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  OfficeConfig,
  AttendanceLog,
  LeaveRequest,
  DailyActivity,
} from "../types";
import CameraCapture from "./CameraCapture";
import OrgChart from "./OrgChart";
import { isFaceDetected } from "../services/faceApiService";
import {
  apiService,
  getApiBase,
  getStorageMode,
  setStorageMode,
} from "../services/apiService";
import { initFirebase } from "../services/firebaseService";
import "./css/adminpanel.css";

interface AdminPanelProps {
  users: User[];
  config: OfficeConfig;
  logs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  activities: DailyActivity[];
  onUpdateUsers: (users: User[]) => void;
  onUpdateConfig: (config: OfficeConfig) => void;
  onUpdateLogs: (logs: AttendanceLog[]) => Promise<void>;
  onUpdateLeaves: (leaves: LeaveRequest[]) => void;
  onBack: () => void;
}

type GroupMode = "none" | "name" | "date";

const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  config,
  logs,
  leaveRequests,
  activities,
  onUpdateUsers,
  onUpdateConfig,
  onUpdateLogs,
  onUpdateLeaves,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "logs"
    | "leaves"
    | "settings"
    | "organization"
    | "activities"
  >("logs");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  // Selection & Modal States
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTarget, setModalTarget] = useState<"logs" | "users">("logs");
  const [isDeleting, setIsDeleting] = useState(false);

  // Storage Settings
  const [storageMode, setStorageModeState] = useState(getStorageMode());
  const [serverUrl, setServerUrl] = useState(getApiBase());
  const [fbConfigStr, setFbConfigStr] = useState(
    localStorage.getItem("FIREBASE_CONFIG") || ""
  );
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false);
  const [showErrorWidget, setShowErrorWidget] = useState(false);
  const [showFaceError, setShowFaceError] = useState(false);

  useEffect(() => {
    setServerUrl(getApiBase());
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingEndpoint(true);
    try {
      if (storageMode === "FIREBASE") {
        const configObj = JSON.parse(fbConfigStr);
        const success = initFirebase(configObj);
        if (!success) throw new Error("Invalid Firebase Config");
        localStorage.setItem("FIREBASE_CONFIG", fbConfigStr);
      } else {
        const isHealthy = await apiService.checkHealth(serverUrl);
        if (!isHealthy) throw new Error("Cannot reach local server");
        apiService.saveEndpoint(serverUrl);
      }
      setStorageMode(storageMode);
      window.location.reload();
    } catch (err) {
      setShowErrorWidget(true);
    } finally {
      setIsSavingEndpoint(false);
    }
  };

  const handleLeaveAction = (id: string, status: "APPROVED" | "REJECTED") => {
    const updated = leaveRequests.map((l) =>
      l.id === id ? { ...l, status } : l
    );
    onUpdateLeaves(updated);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(
      (l) =>
        l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaveRequests, searchTerm]);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.activityType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, searchTerm]);

  const groupedLogs = useMemo(() => {
    if (groupMode === "none") return { "All Logs": filteredLogs };
    const groups: { [key: string]: AttendanceLog[] } = {};
    filteredLogs.forEach((log) => {
      let key = "";
      if (groupMode === "name") key = log.userName;
      else if (groupMode === "date")
        key = new Date(log.timestamp).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [filteredLogs, groupMode]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "SUCCESS").length;
    const pendingLeaves = leaveRequests.filter(
      (l) => l.status === "PENDING"
    ).length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, success, pendingLeaves, successRate };
  }, [logs, leaveRequests]);

  const handleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllLogs = () => {
    if (filteredLogs.length === selectedLogIds.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map((l) => String(l.id)));
    }
  };

  const openConfirmModal = (target: "logs" | "users") => {
    setModalTarget(target);
    setShowConfirmModal(true);
  };

  const executeDelete = async () => {
    setShowConfirmModal(false);
    setIsDeleting(true);
    try {
      if (modalTarget === "logs") {
        const remainingLogs = logs.filter(
          (log) => !selectedLogIds.includes(String(log.id))
        );
        await onUpdateLogs(remainingLogs);
        setSelectedLogIds([]);
      } else {
        const remainingUsers = users.filter(
          (user) => !selectedUserIds.includes(String(user.id))
        );
        onUpdateUsers(remainingUsers);
        setSelectedUserIds([]);
      }
    } catch (err: any) {
      alert("Gagal menghapus data.");
    } finally {
      setTimeout(() => setIsDeleting(false), 500);
    }
  };

  const handleRegister = () => {
    if (!name || !empId || !photo || !password) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      employeeId: empId,
      password,
      photoBase64: photo,
      role,
      position,
      reportsTo,
      createdAt: Date.now(),
    };
    onUpdateUsers([...users, newUser]);
    setIsRegistering(false);
    setName("");
    setEmpId("");
    setPhoto(null);
    setPassword("");
    setRole("user");
    setPosition("");
    setReportsTo("");
  };

  const handlePhotoCapture = async (b64: string) => {
    setIsValidating(true);
    const detected = await isFaceDetected(b64);
    setIsValidating(false);
    if (detected) setPhoto(b64);
    else setShowFaceError(true);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
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
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: "logs",
      label: "Attendance Logs",
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "leaves",
      label: `Leaves (${stats.pendingLeaves})`,
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "activities",
      label: "Daily Activities",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      id: "users",
      label: "User Management",
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: "organization",
      label: "Organization Chart",
      icon: (
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "System Settings",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-root">
      {/* MENU DRAWER (Works on all screens) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[5000] animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          ></div>
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-500 overflow-y-auto">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                  Menu
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Admin Portal Nav
                </p>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    toggleMobileMenu();
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                    activeTab === item.id
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`${
                      activeTab === item.id ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-auto p-8 border-t border-slate-50">
              <button
                onClick={onBack}
                className="w-full py-4 border border-slate-100 rounded-2xl text-[9px] font-black uppercase text-slate-400 tracking-widest"
              >
                Exit Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR & FEEDBACK MODALS */}
      {showFaceError && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowFaceError(false)}
          ></div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative w-full max-sm border border-indigo-50 animate-in zoom-in-95 duration-300 text-center">
            <h3 className="text-xl font-black text-slate-800 uppercase mb-2">
              Wajah Tidak Dikenali
            </h3>
            <p className="text-slate-400 text-[10px] mb-8 font-bold uppercase tracking-widest">
              AI tidak dapat mendeteksi wajah pada foto ini.
            </p>
            <button
              onClick={() => setShowFaceError(false)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div
            className="modal-backdrop"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          <div className="modal-card animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-800 text-center uppercase">
              Konfirmasi Hapus
            </h3>
            <p className="text-slate-500 text-xs text-center mt-2">
              Hapus{" "}
              {modalTarget === "logs"
                ? selectedLogIds.length
                : selectedUserIds.length}{" "}
              data terpilih?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={executeDelete}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold uppercase text-[10px]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      <header className="admin-header">
        <div className="flex items-center justify-between gap-4 w-full h-full">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 active:scale-95 transition-all"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none">
                Admin Portal
              </h2>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hidden md:block mt-1">
                Active Tab: {menuItems.find((m) => m.id === activeTab)?.label}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="admin-search-box">
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {users.length} Users
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "dashboard" && (
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
            {[
              {
                l: "Total Absensi",
                v: stats.total,
                i: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                c: "slate-800",
              },
              {
                l: "Daily Activities",
                v: activities.length,
                i: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                ),
                c: "blue-600",
              },
              {
                l: "Pending Approval",
                v: stats.pendingLeaves,
                i: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                ),
                c: "amber-600",
              },
              {
                l: "Total Users",
                v: users.length,
                i: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ),
                c: "indigo-600",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border shadow-sm text-center animate-in zoom-in-95 duration-500"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className={`flex justify-center mb-2 text-${s.c} opacity-40`}
                >
                  {s.i}
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {s.l}
                </p>
                <h4 className={`text-2xl font-black text-${s.c}`}>{s.v}</h4>
              </div>
            ))}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="admin-table-wrapper">
            <div className="bg-white py-2 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={
                    filteredLogs.length > 0 &&
                    selectedLogIds.length === filteredLogs.length
                  }
                  onChange={handleSelectAllLogs}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600"
                />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Log Aktivitas
                </p>
                <div className="relative">
                  <button
                    onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                    className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md"
                  >
                    Group: {groupMode}
                  </button>
                  {isGroupMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-xl z-[100] py-1 min-w-[120px]">
                      {(["none", "name", "date"] as GroupMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setGroupMode(mode);
                            setIsGroupMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-[9px] font-black uppercase hover:bg-slate-50"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {selectedLogIds.length > 0 && (
                <button
                  onClick={() => openConfirmModal("logs")}
                  className="p-1.5 bg-red-50 text-red-600 rounded-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="admin-table-container admin-custom-scrollbar">
              <table className="admin-table">
                <thead className="admin-thead">
                  <tr>
                    <th className="px-3 py-3 w-8">#</th>
                    <th className="px-2 py-3">Nama Karyawan</th>
                    <th className="px-2 py-3">Waktu</th>
                    <th className="px-2 py-3 text-center">GPS</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody divide-y">
                  {Object.entries(groupedLogs).map(([groupKey, groupItems]) => (
                    <React.Fragment key={groupKey}>
                      {groupMode !== "none" && (
                        <tr className="bg-slate-50">
                          <td
                            colSpan={4}
                            className="px-4 py-1.5 text-[8px] font-black text-indigo-500 uppercase"
                          >
                            {groupKey}
                          </td>
                        </tr>
                      )}
                      {groupItems.map((log) => (
                        <tr
                          key={log.id}
                          className={
                            selectedLogIds.includes(String(log.id))
                              ? "bg-indigo-50/40"
                              : ""
                          }
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLogIds.includes(String(log.id))}
                              onChange={() => handleSelectLog(String(log.id))}
                              className="w-3.5 h-3.5"
                            />
                          </td>
                          <td className="px-2 py-2 flex items-center gap-2">
                            <img
                              src={log.capturedPhoto}
                              className="w-8 h-8 rounded-lg object-cover border"
                              alt=""
                            />
                            <div className="min-w-0">
                              <p className="font-bold truncate">
                                {log.userName}
                              </p>
                              <p className="text-[8px] text-slate-400">
                                {log.userId}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[10px] font-medium">
                            {new Date(log.timestamp).toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="gps-icon-wrapper">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="admin-table-wrapper p-6 overflow-y-auto bg-slate-50/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Daily Activity Monitor
              </h3>
              <div className="bg-white px-4 py-2 rounded-full border shadow-sm">
                <span className="text-[9px] font-black uppercase text-indigo-600">
                  {filteredActivities.length} Activities Found
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white p-5 rounded-[2.5rem] border shadow-xl shadow-slate-200/40 flex flex-col md:flex-row gap-6 group hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-start gap-4 flex-shrink-0">
                      {act.photo ? (
                        <img
                          src={act.photo}
                          className="w-20 h-24 object-cover rounded-2xl shadow-md border"
                          alt=""
                        />
                      ) : (
                        <div className="w-20 h-24 bg-slate-50 rounded-2xl border flex items-center justify-center text-slate-300">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
                          {act.task}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            {act.activityType}
                          </span>
                          {act.stockCount !== undefined && (
                            <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                              Stock: {act.stockCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                          Performed by:
                        </p>
                        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">
                          {act.userName}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 border-l border-slate-50 md:pl-6 flex flex-col justify-center">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Time Window
                          </p>
                          <p className="text-[11px] font-black text-slate-700">
                            {new Date(act.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(act.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Date Recorded
                          </p>
                          <p className="text-[11px] font-black text-slate-700">
                            {new Date(act.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      {act.location && (
                        <div className="mt-3 flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                          <svg
                            className="w-3.5 h-3.5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            GPS Verified: {act.location.lat.toFixed(4)},{" "}
                            {act.location.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    No activities found to monitor
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="admin-table-wrapper p-4 md:p-8 overflow-y-auto">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
              Persetujuan HR (Cuti/Izin/Sakit)
            </h3>
            <div className="grid gap-3">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 text-[10px] uppercase">
                      {leave.userName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase">
                        {leave.userName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        {leave.type} | {leave.startDate} - {leave.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      {leave.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {leave.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() =>
                            handleLeaveAction(leave.id, "REJECTED")
                          }
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            handleLeaveAction(leave.id, "APPROVED")
                          }
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[9px] font-black uppercase"
                        >
                          Approve
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl ${
                          leave.status === "APPROVED"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {leave.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredLeaves.length === 0 && (
                <p className="text-center py-10 text-slate-400 text-[10px] uppercase font-black">
                  Tidak ada pengajuan ditemukan.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="p-4 md:p-8 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Karyawan Terdaftar ({users.length})
              </h3>
              <button
                onClick={() => setIsRegistering(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase"
              >
                + Baru
              </button>
            </div>
            {isRegistering ? (
              <div className="bg-white p-6 rounded-[2.5rem] border shadow-2xl max-w-4xl mx-auto animate-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-xl p-3 text-[11px] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="NIK / ID Pegawai"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        className="w-full border rounded-xl p-3 text-[11px] outline-none"
                      />
                    </div>
                    <input
                      type="password"
                      placeholder="Password Login"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-xl p-3 text-[11px] outline-none"
                    />

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                        Organization Mapping
                      </p>
                      <input
                        type="text"
                        placeholder="Jabatan / Posisi"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full border bg-white rounded-xl p-3 text-[11px] outline-none"
                      />
                      <select
                        value={reportsTo}
                        onChange={(e) => setReportsTo(e.target.value)}
                        className="w-full border bg-white rounded-xl p-3 text-[11px] outline-none appearance-none"
                      >
                        <option value="">-- Tanpa Atasan (CEO/Root) --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            Atasan: {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-6 bg-slate-50 p-3 rounded-xl justify-center">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase">
                        <input
                          type="radio"
                          checked={role === "user"}
                          onChange={() => setRole("user")}
                          className="accent-indigo-600"
                        />{" "}
                        User
                      </label>
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase">
                        <input
                          type="radio"
                          checked={role === "admin"}
                          onChange={() => setRole("admin")}
                          className="accent-indigo-600"
                        />{" "}
                        Admin
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleRegister}
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        Simpan Karyawan
                      </button>
                      <button
                        onClick={() => setIsRegistering(false)}
                        className="px-6 border py-4 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    {photo ? (
                      <img
                        src={photo}
                        className="w-full h-48 md:h-full object-cover rounded-[2rem] border shadow-md"
                      />
                    ) : (
                      <CameraCapture
                        onCapture={handlePhotoCapture}
                        label="Foto Master Karyawan"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white border border-slate-100 p-4 rounded-[1.5rem] flex flex-col gap-3 relative transition-all group hover:shadow-xl hover:border-indigo-100"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={user.photoBase64}
                        className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-[12px] uppercase tracking-tighter truncate leading-none mb-1">
                          {user.name}
                        </p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                          {user.employeeId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 mt-1 border-slate-50">
                      <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                        {user.position || "Employee"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedUserIds([String(user.id)]);
                          openConfirmModal("users");
                        }}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "organization" && (
          <div className="flex-1 overflow-auto bg-slate-50">
            <OrgChart users={users} onBack={() => setActiveTab("dashboard")} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-4 md:p-8 overflow-y-auto space-y-6">
            <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Penyimpanan & Database
              </h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                <button
                  onClick={() => setStorageModeState("LOCAL")}
                  className={`py-2 rounded-lg text-[9px] font-black uppercase ${
                    storageMode === "LOCAL"
                      ? "bg-white shadow text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  Node.js Local
                </button>
                <button
                  onClick={() => setStorageModeState("FIREBASE")}
                  className={`py-2 rounded-lg text-[9px] font-black uppercase ${
                    storageMode === "FIREBASE"
                      ? "bg-white shadow text-orange-600"
                      : "text-slate-400"
                  }`}
                >
                  Firebase Cloud
                </button>
              </div>
              {storageMode === "LOCAL" ? (
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg px-4 py-3 text-[11px] font-bold"
                  placeholder="URL Server Lokal"
                />
              ) : (
                <textarea
                  value={fbConfigStr}
                  onChange={(e) => setFbConfigStr(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg px-4 py-3 text-[10px] font-mono h-32"
                  placeholder="JSON Firebase Config"
                />
              )}
              <button
                onClick={handleSaveSettings}
                disabled={isSavingEndpoint}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
              >
                {isSavingEndpoint ? "Connecting..." : "Update Storage Settings"}
              </button>
            </div>

            <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Geofencing Kantor
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  value={config.latitude}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      latitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-[11px] font-bold"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="any"
                  value={config.longitude}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      longitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-[11px] font-bold"
                  placeholder="Lng"
                />
              </div>
              <input
                type="number"
                value={config.maxDistance}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    maxDistance: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-center text-lg font-black"
                placeholder="Radius (Meter)"
              />
              <button
                onClick={() =>
                  navigator.geolocation.getCurrentPosition((p) =>
                    onUpdateConfig({
                      ...config,
                      latitude: p.coords.latitude,
                      longitude: p.coords.longitude,
                    })
                  )
                }
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase"
              >
                Gunakan Lokasi Saya
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
