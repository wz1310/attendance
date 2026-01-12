import React, { useState, useMemo, useEffect } from "react";
import { User, DailyActivity } from "../types";
import CameraCapture from "./CameraCapture";
import { getCurrentPosition } from "../utils/geoUtils";

interface ActivityPanelProps {
  user: User;
  allUsers: User[];
  activities: DailyActivity[];
  onAddActivity: (activity: DailyActivity) => void;
  onBack: () => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({
  user,
  allUsers,
  activities,
  onAddActivity,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"Me" | "Your Subordinate">("Me");
  const [selectedTimUser, setSelectedTimUser] = useState<User>(user);
  const [isRecording, setIsRecording] = useState(false);

  // Helper to format Date to datetime-local string (YYYY-MM-DDTHH:MM)
  const formatToDateTimeLocal = (dateNum: number) => {
    const d = new Date(dateNum);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Recording States
  const [task, setTask] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(Date.now() + 3600000); // Default 1 hour later
  const [activityType, setActivityType] = useState("Promoter Task");
  const [stockCount, setStockCount] = useState<number>(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const subordinates = useMemo(() => {
    return allUsers.filter((u) => u.reportsTo === user.id);
  }, [allUsers, user.id]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => a.userId === selectedTimUser.id);
  }, [activities, selectedTimUser.id]);

  const handleSave = async () => {
    if (!task) {
      alert("Please enter a task name.");
      return;
    }

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
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save activity. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isRecording) {
    return (
      <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
        <header className="px-6 py-5 flex items-center gap-4 bg-white sticky top-0 z-50 border-b border-slate-50">
          <button
            onClick={() => setIsRecording(false)}
            className="p-2 text-slate-400"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
            Activity Recording
          </h1>
        </header>

        <div className="p-6 space-y-6">
          <div className="relative w-full h-48 bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-6.2,106.81&zoom=15&size=600x400&sensor=false')] bg-cover opacity-60"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full border-4 border-white shadow-xl animate-bounce"></div>
              {location && (
                <div className="mt-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border shadow-sm">
                  <p className="text-[9px] font-black text-slate-800 uppercase">
                    Location accuracy {location.accuracy} meters
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Photo
            </label>
            <div className="flex gap-3">
              {photo ? (
                <div className="relative w-20 h-20">
                  <img
                    src={photo}
                    className="w-full h-full object-cover rounded-2xl border"
                    alt=""
                  />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-md p-1 border-2 border-white shadow-sm"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2">
                  <CameraCapture
                    onCapture={(b64) => setPhoto(b64)}
                    label="Ambil Foto Kegiatan"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Task *
              </label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Work"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={formatToDateTimeLocal(startTime)}
                  onChange={(e) =>
                    setStartTime(new Date(e.target.value).getTime())
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-600 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={formatToDateTimeLocal(endTime)}
                  onChange={(e) =>
                    setEndTime(new Date(e.target.value).getTime())
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Activity Type
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none appearance-none"
              >
                <option>Promoter Task</option>
                <option>Sales Call</option>
                <option>Maintenance</option>
                <option>Patrol</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Stock Count
              </label>
              <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-4 bg-[#FF9500] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95 ${
                isSaving ? "opacity-50" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 py-5 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
            Daily Activity
          </h1>
        </div>
        <button className="text-slate-400">
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7"
            />
          </svg>
        </button>
      </header>

      <div className="px-6 space-y-6">
        <div className="flex gap-8 border-b border-slate-50">
          <button
            onClick={() => {
              setActiveTab("Me");
              setSelectedTimUser(user);
            }}
            className={`pb-4 text-[13px] font-black uppercase tracking-tight transition-all border-b-2 ${
              activeTab === "Me"
                ? "text-slate-800 border-indigo-600"
                : "text-slate-300 border-transparent"
            }`}
          >
            Me
          </button>
          <button
            onClick={() => setActiveTab("Your Subordinate")}
            className={`pb-4 text-[13px] font-black uppercase tracking-tight transition-all border-b-2 ${
              activeTab === "Your Subordinate"
                ? "text-slate-800 border-indigo-600"
                : "text-slate-300 border-transparent"
            }`}
          >
            Your Subordinate
          </button>
        </div>

        {activeTab === "Your Subordinate" && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {subordinates.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedTimUser(sub)}
                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                  selectedTimUser.id === sub.id ? "scale-105" : "opacity-60"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full p-0.5 border-2 ${
                    selectedTimUser.id === sub.id
                      ? "border-pink-500"
                      : "border-slate-100"
                  }`}
                >
                  <img
                    src={sub.photoBase64}
                    className="w-full h-full object-cover rounded-full"
                    alt=""
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 lowercase">
                  {sub.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-slate-50 rounded-[2rem] p-5 shadow-inner">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase">
              October 2024
            </h3>
          </div>
          <div className="flex justify-between">
            {[6, 7, 8, 9, 10, 11, 12].map((d) => (
              <div key={d} className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d % 7]}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                    d === 11
                      ? "bg-blue-400 text-white shadow-lg shadow-blue-100"
                      : "text-slate-800 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {d.toString().padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                className="bg-slate-50 p-5 rounded-[2rem] border shadow-sm animate-in fade-in duration-500"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                    {act.task}
                  </h4>
                  <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                    {act.activityType}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
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
                {act.photo && (
                  <img
                    src={act.photo}
                    className="mt-3 w-full h-32 object-cover rounded-2xl border"
                    alt=""
                  />
                )}
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                You don't have any activity
              </h3>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsRecording(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-[#FF9500] text-white rounded-full flex items-center justify-center shadow-2xl z-40"
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
            strokeWidth="3"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default ActivityPanel;
