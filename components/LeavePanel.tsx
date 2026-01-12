import React, { useState, useEffect, useRef } from "react";
import { User, LeaveRequest, AppRoute } from "../types";

interface LeavePanelProps {
  users: User[];
  leaveRequests: LeaveRequest[];
  onUpdateLeaves: (leaves: LeaveRequest[]) => void;
  onBack: () => void;
  onViewProfile?: (user: User) => void;
}

interface Notification {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const LeavePanel: React.FC<LeavePanelProps> = ({
  users,
  leaveRequests,
  onUpdateLeaves,
  onBack,
  onViewProfile,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");

  // Form States
  const [type, setType] = useState<"Cuti" | "Izin" | "Sakit">("Cuti");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ show: true, message, type });
  };

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      setError("");
    } else {
      setError("ID atau Password salah.");
    }
  };

  const handleSelectLeave = (leave: LeaveRequest) => {
    if (leave.status === "APPROVED") return;
    setType(leave.type);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setReason(leave.reason);
    setEditingLeaveId(leave.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    setReason("");
    setType("Cuti");
    setEditingLeaveId(null);
  };

  const handleAction = async (status: "DRAFT" | "PENDING") => {
    if (!selectedUser || !startDate || !endDate || !reason) {
      showToast("Harap lengkapi semua isian formulir.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingLeaveId) {
        const updatedLeaves = leaveRequests.map((l) =>
          l.id === editingLeaveId
            ? {
                ...l,
                type,
                startDate,
                endDate,
                reason,
                status,
                createdAt: Date.now(),
              }
            : l
        );
        onUpdateLeaves(updatedLeaves);
        showToast(
          status === "DRAFT"
            ? "Draft berhasil diperbarui."
            : "Pengajuan telah dikirim ke HR."
        );
      } else {
        const newRequest: LeaveRequest = {
          id: Math.random().toString(36).substr(2, 9),
          userId: selectedUser.employeeId,
          userName: selectedUser.name,
          type,
          startDate,
          endDate,
          reason,
          status,
          createdAt: Date.now(),
        };
        onUpdateLeaves([newRequest, ...leaveRequests]);
        showToast(
          status === "DRAFT"
            ? "Tersimpan sebagai Draft."
            : "Pengajuan baru berhasil dikirim."
        );
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const userLeaves = leaveRequests.filter(
    (l) => l.userId === selectedUser?.employeeId
  );

  const leaveOptions = [
    {
      value: "Cuti",
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      value: "Izin",
      color: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      value: "Sakit",
      color: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100 text-center animate-in zoom-in-95">
          <button
            onClick={onBack}
            className="mb-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"
          >
            <svg
              className="w-4 h-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">
            Pengajuan HR
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            Login untuk Membuat Pengajuan
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="ID Pegawai"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-xs outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-xs outline-none"
              required
            />
            {error && (
              <p className="text-red-500 text-[9px] font-black uppercase">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Lanjutkan
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      {/* TOAST WIDGET */}
      <div
        className={`fixed top-6 right-6 z-[9999] transition-all duration-500 transform ${
          notification.show
            ? "translate-x-0 opacity-100"
            : "translate-x-12 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            notification.type === "success"
              ? "bg-white border-green-100"
              : "bg-white border-red-100"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              notification.type === "success"
                ? "bg-green-50 text-green-500"
                : "bg-red-50 text-red-500"
            }`}
          >
            {notification.type === "success" ? (
              <svg
                className="w-4 h-4"
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
                className="w-4 h-4"
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
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
            {notification.message}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white p-6 rounded-[2rem] border shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 bg-slate-100 rounded-full"
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
                  strokeWidth="2.5"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="font-black text-slate-800 uppercase text-sm">
                {selectedUser.name}
              </h1>
              <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
                {selectedUser.employeeId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewProfile && onViewProfile(selectedUser)}
              className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-50 transition-all"
            >
              Profil Saya
            </button>
            <button
              onClick={onBack}
              className="text-[9px] font-black text-slate-400 uppercase tracking-widest border px-4 py-2 rounded-full hover:bg-slate-50 transition-all"
            >
              Selesai
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 md:p-7 rounded-[2rem] border shadow-xl sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                  {editingLeaveId ? "Edit Pengajuan" : "Buat Pengajuan Baru"}
                </h3>
                {editingLeaveId && (
                  <button
                    onClick={resetForm}
                    className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-md"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* CUSTOM EYE-CATCHING DROPDOWN */}
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Jenis Pengajuan
                  </label>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          leaveOptions.find((o) => o.value === type)?.color
                        }`}
                      ></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        {type}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-2 animate-in slide-in-from-top-2 duration-200">
                      {leaveOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            setType(option.value as any);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 hover:bg-slate-50 ${
                            type === option.value ? option.bg : ""
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${option.color}`}
                          ></div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              type === option.value
                                ? option.text
                                : "text-slate-500"
                            }`}
                          >
                            {option.value}
                          </span>
                          {type === option.value && (
                            <svg
                              className={`w-3.5 h-3.5 ml-auto ${option.text}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="4"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Alasan / Keterangan
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                    placeholder="Tulis alasan lengkap pengajuan..."
                  ></textarea>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction("DRAFT")}
                    disabled={isSubmitting}
                    className="flex-1 py-4 border-2 border-slate-50 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Simpan Draft
                  </button>
                  <button
                    onClick={() => handleAction("PENDING")}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {editingLeaveId ? "Update & Ajukan" : "Kirim Sekarang"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
              Riwayat Pengajuan Anda
            </h3>
            <p className="text-[8px] text-slate-300 uppercase tracking-widest ml-2 -mt-2 mb-4 italic">
              Ketuk pada riwayat DRAFT atau PENDING untuk memperbarui data
            </p>
            {userLeaves.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.3em]">
                  Belum Ada Riwayat Pengajuan
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    onClick={() => handleSelectLeave(leave)}
                    className={`bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group transition-all duration-300 ${
                      leave.status === "APPROVED"
                        ? "cursor-default opacity-80"
                        : "cursor-pointer hover:shadow-xl hover:border-indigo-100"
                    } ${
                      editingLeaveId === leave.id
                        ? "ring-4 ring-indigo-500/10 border-indigo-200"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[11px] uppercase shadow-inner ${
                          leave.type === "Cuti"
                            ? "bg-blue-50 text-blue-600"
                            : leave.type === "Sakit"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {leave.type.substring(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-black text-slate-800 text-[13px] uppercase tracking-tighter">
                            {leave.type}
                          </p>
                          <span
                            className={`text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${
                              leave.status === "PENDING"
                                ? "bg-amber-100 text-amber-600"
                                : leave.status === "APPROVED"
                                ? "bg-green-100 text-green-600"
                                : leave.status === "REJECTED"
                                ? "bg-red-100 text-red-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(leave.startDate).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" }
                          )}{" "}
                          —{" "}
                          {new Date(leave.endDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-400 italic max-w-[200px] truncate group-hover:whitespace-normal transition-all leading-relaxed">
                        {leave.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavePanel;
