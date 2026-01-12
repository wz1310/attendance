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
    <div className="h-screen bg-[#F8F9FA] flex flex-col overflow-hidden">
      {/* Container utama dengan h-full agar bisa memisahkan header dan content */}
      <div className="w-full bg-white h-full flex flex-col relative overflow-hidden">
        {/* Detail View Container (Overlay/Slide-in) */}
        <div
          className={`absolute inset-0 bg-white z-[60] transition-transform duration-500 transform ${
            activeCategory ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-10 shadow-sm">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveCategory(null)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                {activeCategory}
              </h1>
            </div>
          </header>

          <div className="p-8 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
            {activeCategory === "Permohonan Karyawan" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                            leave.type === "Cuti"
                              ? "bg-blue-100 text-blue-600"
                              : leave.type === "Sakit"
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {leave.type}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
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
                      <div className="mb-4">
                        <p className="text-[13px] font-black text-slate-700 uppercase">
                          {leave.startDate} — {leave.endDate}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {leave.reason}
                      </p>
                      <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.2em] mt-4 text-right">
                        Diajukan:{" "}
                        {new Date(leave.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Belum ada riwayat permohonan
                    </p>
                  </div>
                )}
              </div>
            ) : activeCategory === "Daftar Kehadiran" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex gap-6 items-center"
                    >
                      <img
                        src={log.capturedPhoto}
                        className="w-20 h-20 rounded-[1.5rem] object-cover border border-slate-50 shadow-sm"
                        alt="Attendance"
                      />
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
                        </div>
                        <p className="text-xl font-black text-indigo-600">
                          {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                              log.status === "SUCCESS"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {log.status}
                          </span>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            | Dist: {log.distance.toFixed(0)}m
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
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

        {/* Main Header Memanjang - Tetap di Atas (Sticky/Fixed Context) */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 flex-shrink-0 bg-white z-[40] shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
              PROFIL KARYAWAN
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Indikator status dihapus sesuai permintaan sebelumnya */}
          </div>
        </header>

        {/* Main Content Area - Area yang bisa di-scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Extended Profile Card */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10">
              <div className="relative flex-shrink-0">
                <img
                  src={user.photoBase64}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover ring-8 ring-slate-50 shadow-xl"
                  alt={user.name}
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
                    {user.name}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                      {user.position || "Employee"}
                    </span>
                    <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {user.employeeId}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
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
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        PT Fanvil Solution 2
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        NISSI BINTARO CAMPUS
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2.5 rounded-2xl text-orange-600">
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
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        Daftar Sejak
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button className="flex items-center justify-center gap-3 px-8 py-5 border border-slate-100 rounded-[2rem] bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95 group">
                  <svg
                    className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 17h.01M13 17h.01M9 17h.01M17 13h.01M13 13h.01M9 13h.01M17 9h.01M13 9h.01M9 9h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2zM7 5h10v14H7V5z" />
                  </svg>
                  <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">
                    ID QR Code
                  </span>
                </button>
                <button className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group">
                  <svg
                    className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform"
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
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Edit Profil
                  </span>
                </button>
              </div>
            </div>

            {/* Menu Grid - Memanfaatkan ruang lebar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategoryClick(item.title)}
                  className="group flex flex-col items-start gap-6 p-8 bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 rounded-[3rem] transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight mb-2 leading-none">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Buka Detail
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
