import React, { useState } from "react";
import { User, LeaveRequest, AttendanceLog } from "../types";

interface UserProfileProps {
  user: User;
  leaveRequests: LeaveRequest[];
  attendanceLogs: AttendanceLog[];
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  leaveRequests,
  attendanceLogs,
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredLeaves = leaveRequests.filter(
    (l) => l.userId === user.employeeId
  );
  const filteredLogs = attendanceLogs.filter(
    (log) => log.userId === user.employeeId
  );

  const menuItems = [
    {
      title: "Pribadi",
      desc: "Informasi Dasar, Alamat, Kontak Darurat, Keluarga, Pendidikan...",
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
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5L12 4l-2 2z"
          />
        </svg>
      ),
    },
    {
      title: "Data Ketenagakerjaan",
      desc: "Karir, Disiplin, Kontrak Kerja, Struktur Organisasi...",
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
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Daftar Kehadiran",
      desc: "Kehadiran Karyawan, Log Harian, Rekap Bulanan...",
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Permohonan Karyawan",
      desc: "Koreksi Kehadiran, Cuti, Lembur, Klaim Reimbursment...",
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
  ];

  const handleCategoryClick = (title: string) => {
    setActiveCategory(title);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center">
      <div className="w-full max-w-lg bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        {/* Detail View Container (Overlay/Slide-in) */}
        <div
          className={`absolute inset-0 bg-white z-[50] transition-transform duration-500 transform ${
            activeCategory ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="px-6 py-5 flex items-center gap-6 border-b border-slate-50 sticky top-0 bg-white z-10">
            <button
              onClick={() => setActiveCategory(null)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-slate-600"
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
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {activeCategory}
            </h1>
          </header>

          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
            {activeCategory === "Permohonan Karyawan" ? (
              <div className="space-y-4">
                {filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                              leave.type === "Cuti"
                                ? "bg-blue-100 text-blue-600"
                                : leave.type === "Sakit"
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {leave.type}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            leave.status === "APPROVED"
                              ? "bg-green-100 text-green-600"
                              : leave.status === "REJECTED"
                              ? "bg-red-100 text-red-600"
                              : leave.status === "PENDING"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </div>
                      <div className="mb-2">
                        <p className="text-[11px] font-black text-slate-700 uppercase">
                          {leave.startDate} — {leave.endDate}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          Status: {leave.type}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-500 italic bg-white p-3 rounded-2xl border border-slate-100 mt-2">
                        {leave.reason}
                      </p>
                      <p className="text-[7px] text-slate-300 font-black uppercase tracking-[0.2em] mt-3 text-right">
                        Diajukan:{" "}
                        {new Date(leave.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-slate-200"
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
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Belum ada riwayat permohonan
                    </p>
                  </div>
                )}
              </div>
            ) : activeCategory === "Daftar Kehadiran" ? (
              <div className="space-y-4">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex gap-5 items-center"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={log.capturedPhoto}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-50"
                          alt="Attendance"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                            {new Date(log.timestamp).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </p>
                          <span
                            className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${
                              log.status === "SUCCESS"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[14px] font-black text-slate-500 leading-none">
                          {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <svg
                            className="w-3 h-3 text-slate-300"
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
                          </svg>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Distance: {log.distance.toFixed(0)}m
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-slate-200"
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
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Belum ada riwayat kehadiran
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                  Modul Sedang Dikembangkan...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Header */}
        <header className="px-6 py-5 flex items-center gap-6 border-b border-slate-50 sticky top-0 bg-white z-10">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-600"
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
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            Profil Karyawan
          </h1>
        </header>

        {/* Profile Card */}
        <div className="p-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <img
                  src={user.photoBase64}
                  className="w-24 h-24 rounded-[2rem] object-cover ring-4 ring-slate-50 shadow-md"
                  alt={user.name}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
                  {user.name}
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {user.position || "Employee"}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {user.employeeId}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-slate-500">
                <div className="bg-slate-50 p-2.5 rounded-xl">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    PT Fanvil Solution 2
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    NISSI BINTARO CAMPUS
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button className="flex items-center justify-center gap-2 py-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition-all group">
                <svg
                  className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 17h.01M13 17h.01M9 17h.01M17 13h.01M13 13h.01M9 13h.01M17 9h.01M13 9h.01M9 9h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2zM7 5h10v14H7V5z" />
                </svg>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                  Kode QR
                </span>
              </button>
              <button className="flex items-center justify-center gap-2 py-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition-all group">
                <svg
                  className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform"
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
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                  Rekan
                </span>
              </button>
            </div>

            <div className="flex justify-center gap-6 pt-2">
              {["facebook", "x", "instagram", "whatsapp", "linkedin"].map(
                (social) => (
                  <button
                    key={social}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase">
                        {social.charAt(0)}
                      </span>
                    </div>
                  </button>
                )
              )}
              <button className="ml-auto text-slate-300 hover:text-indigo-500">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 px-6 pb-12 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCategoryClick(item.title)}
              className="group flex items-center gap-5 p-5 bg-white border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-3xl transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-sm">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight mb-0.5">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed truncate">
                  {item.desc}
                </p>
              </div>
              <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
