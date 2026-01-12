import React, { useState, useMemo, useEffect, useRef } from "react";
import { User, DailyActivity } from "../types";
import CameraCapture, { CameraCaptureHandle } from "./CameraCapture";
import { getCurrentPosition } from "../utils/geoUtils";

interface ActivityPanelProps {
  user: User;
  allUsers: User[];
  activities: DailyActivity[];
  onAddActivity: (activity: DailyActivity) => void;
  onUpdateActivities: (activities: DailyActivity[]) => void;
  onBack: () => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({
  user,
  allUsers,
  activities,
  onAddActivity,
  onUpdateActivities,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"Me" | "Your Subordinate">("Me");
  const [selectedTimUser, setSelectedTimUser] = useState<User>(user);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraCaptureHandle>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState<string | null>(
    null
  );

  const [task, setTask] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(Date.now() + 3600000);
  const [activityType, setActivityType] = useState("Promoter Task");
  const [stockCount, setStockCount] = useState<number>(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formatToDateTimeLocal = (dateNum: number) => {
    const d = new Date(dateNum);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isRecording) {
      getCurrentPosition()
        .then((pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          });
        })
        .catch((err) => console.error("Location error", err));
    }
  }, [isRecording]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => a.userId === selectedTimUser.id);
  }, [activities, selectedTimUser.id]);

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      const newActivity: DailyActivity = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        task,
        startTime,
        endTime,
        activityType,
        stockCount,
        photo: photo || undefined,
        location: location || undefined,
        createdAt: Date.now(),
      };
      await onAddActivity(newActivity);
      setIsRecording(false);
      setTask("");
      setPhoto(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCapture = () => {
    if (cameraRef.current) {
      const b64 = cameraRef.current.capture();
      if (b64) {
        setPhoto(b64);
      }
    }
  };

  const executeDelete = async (activityId: string) => {
    setIsProcessingDelete(activityId);
    try {
      const updated = activities.filter(
        (a) => String(a.id) !== String(activityId)
      );
      await onUpdateActivities(updated);
    } finally {
      setIsProcessingDelete(null);
      setConfirmDeleteId(null);
    }
  };

  if (isRecording) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 flex-shrink-0 bg-white z-[40] shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsRecording(false)}
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
              Activity Recording
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="relative w-full h-64 bg-slate-100 rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
              <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-6.2,106.81&zoom=15&size=800x600&sensor=false')] bg-cover opacity-20"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full border-[6px] border-white shadow-2xl animate-bounce"></div>
                <div className="mt-4 px-6 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                    Tracking GPS Active
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Task Details
                  </label>
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Apa yang Anda kerjakan?"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                      Mulai
                    </label>
                    <input
                      type="datetime-local"
                      value={formatToDateTimeLocal(startTime)}
                      onChange={(e) =>
                        setStartTime(new Date(e.target.value).getTime())
                      }
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                      Selesai
                    </label>
                    <input
                      type="datetime-local"
                      value={formatToDateTimeLocal(endTime)}
                      onChange={(e) =>
                        setEndTime(new Date(e.target.value).getTime())
                      }
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Tipe Aktivitas
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[11px] font-black outline-none appearance-none"
                  >
                    <option>Promoter Task</option>
                    <option>Reporting</option>
                    <option>Stock Check</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                <div className="w-full relative">
                  {!photo ? (
                    <div className="relative group/cam">
                      {/* hideButton=true agar tombol bawaan tidak muncul */}
                      <CameraCapture
                        ref={cameraRef}
                        onCapture={(b64) => setPhoto(b64)}
                        label="Photo Document"
                        hideButton={true}
                      />

                      {/* Tombol Capture Overlay di posisi bawah */}
                      <div className="absolute inset-x-0 bottom-12 flex items-center justify-center pointer-events-none">
                        <button
                          onClick={handleCapture}
                          className="pointer-events-auto bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-2xl transition-all active:scale-90 group/btn disabled:opacity-50"
                        >
                          <div className="w-8 h-8 rounded-full border-[3px] border-white group-hover/btn:scale-105 transition-transform"></div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative animate-in zoom-in-95 duration-300">
                      <img
                        src={photo}
                        className="w-full aspect-[4/3] object-cover rounded-[2rem] border-4 border-white shadow-2xl"
                        alt="Preview"
                      />

                      {/* Red X Button for Retake di pojok kanan atas */}
                      <button
                        onClick={() => setPhoto(null)}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all active:scale-90 border-4 border-white z-50"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">
                          Photo Captured
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !task}
                  className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
                    photo
                      ? "bg-[#FF9500] text-white shadow-orange-100"
                      : "bg-slate-900 text-white shadow-slate-200"
                  }`}
                >
                  {isSaving
                    ? "Synchronizing..."
                    : photo
                    ? "Finalize & Upload Activity"
                    : "Save without photo"}
                </button>
                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  {!photo
                    ? "Klik tombol bulat di kamera untuk mengambil foto"
                    : "Klik tanda silang merah untuk mengambil ulang foto"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col overflow-hidden">
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
            DAILY ACTIVITY
          </h1>
        </div>
        <div className="flex items-center gap-4"></div>
      </header>

      <div className="bg-white px-8 flex-shrink-0 border-b border-slate-50 z-[39]">
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-10 relative">
            <button
              onClick={() => {
                setActiveTab("Me");
                setSelectedTimUser(user);
              }}
              className={`pb-4 text-[12px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === "Me"
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Me
              {activeTab === "Me" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 animate-in fade-in slide-in-from-left duration-300"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("Your Subordinate")}
              className={`pb-4 text-[12px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === "Your Subordinate"
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Your Subordinate
              {activeTab === "Your Subordinate" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 animate-in fade-in slide-in-from-right duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-100">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">
              October 2024 Monitor
            </h3>
            <div className="flex justify-between items-center gap-2 overflow-x-auto pb-4 custom-scrollbar px-4">
              {[
                { d: "SAT", n: "06" },
                { d: "SUN", n: "07" },
                { d: "MON", n: "08" },
                { d: "TUE", n: "09" },
                { d: "WED", n: "10" },
                { d: "THU", n: "11", active: true },
                { d: "FRI", n: "12" },
                { d: "SAT", n: "13" },
                { d: "SUN", n: "14" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-6 min-w-[60px]"
                >
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {item.d}
                  </span>
                  <div
                    className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-[13px] font-black transition-all cursor-pointer ${
                      item.active
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110"
                        : "text-slate-800 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {item.n}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {filteredActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 relative group hover:border-indigo-100 transition-all flex flex-col h-full"
                  >
                    {isProcessingDelete === act.id && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-[2.5rem]">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight leading-none">
                        {act.task}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full shadow-sm">
                          {act.activityType}
                        </span>
                        <button
                          onClick={() => executeDelete(act.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all bg-slate-50 rounded-xl"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-6">
                      <span className="text-slate-700">
                        {new Date(act.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="mx-2 opacity-30">—</span>
                      <span className="text-slate-700">
                        {new Date(act.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    {act.photo ? (
                      <img
                        src={act.photo}
                        className="mt-auto w-full h-48 object-cover rounded-[2rem] border border-slate-50 shadow-md"
                        alt=""
                      />
                    ) : (
                      <div className="mt-auto w-full h-48 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-300">
                        <svg
                          className="w-10 h-10"
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
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          No documentation photo
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in-95 duration-700 shadow-xl shadow-slate-200/20">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner">
                  <svg
                    className="w-12 h-12 text-slate-200"
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M10 14l4 4m0-4l-4 4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
                  No activity recorded for today
                </h3>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-sm">
                  Start tracking your productivity by clicking the orange button
                  below. Your reports will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsRecording(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-[#FF9500] text-white rounded-full flex items-center justify-center shadow-[0_25px_60px_rgba(255,149,0,0.4)] z-50 transition-all active:scale-90 hover:scale-105"
      >
        <svg
          className="w-9 h-9"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default ActivityPanel;
