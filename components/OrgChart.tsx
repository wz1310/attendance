import React from "react";
import { User } from "../types";

interface OrgChartProps {
  users: User[];
  onBack: () => void;
}

const OrgNode: React.FC<{
  user: User;
  subordinates: User[];
  allUsers: User[];
}> = ({ user, subordinates, allUsers }) => {
  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className="group relative z-10">
        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-500/5 min-w-[220px] transition-all hover:scale-105 hover:border-indigo-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src={user.photoBase64}
                className="w-16 h-16 rounded-[1.5rem] object-cover ring-4 ring-indigo-50 shadow-md"
                alt={user.name}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 border-4 border-white rounded-full"></div>
            </div>
            <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
              {user.name}
            </h4>
            <div className="bg-indigo-50 px-3 py-1 rounded-full">
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                {user.position || "Employee"}
              </span>
            </div>
            <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
              {user.employeeId}
            </p>
          </div>
        </div>
      </div>

      {/* Connection Down */}
      {subordinates.length > 0 && (
        <div className="h-10 w-0.5 bg-indigo-100 relative">
          <div className="absolute bottom-0 w-2 h-2 bg-indigo-200 rounded-full left-1/2 -translate-x-1/2"></div>
        </div>
      )}

      {/* Children Container */}
      {subordinates.length > 0 && (
        <div className="flex gap-8 relative pt-2">
          {/* Horizontal Connector Line */}
          {subordinates.length > 1 && (
            <div
              className="absolute top-0 left-[50%] -translate-x-1/2 h-0.5 bg-indigo-100"
              style={{ width: `calc(100% - ${220 / subordinates.length}px)` }}
            ></div>
          )}

          {subordinates.map((sub) => (
            <div key={sub.id} className="relative">
              {/* Vertical Connector to Child */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-indigo-100"></div>
              <OrgNode
                user={sub}
                subordinates={allUsers.filter((u) => u.reportsTo === sub.id)}
                allUsers={allUsers}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC<OrgChartProps> = ({ users, onBack }) => {
  // Find top-level managers (those who don't report to anyone else in the list, or the designated CEO)
  const roots = users.filter(
    (u) => !u.reportsTo || !users.find((manager) => manager.id === u.reportsTo)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 overflow-auto custom-scrollbar">
      <div className="max-w-[2000px] mx-auto">
        <header className="flex items-center justify-between mb-16 sticky left-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
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
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                Organizational Structure
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                Corporate Hierarchy Mapping
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="bg-white border p-3 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                {users.length} Active Members
              </span>
            </div>
          </div>
        </header>

        <div className="flex justify-center min-w-max pb-20">
          <div className="space-y-20">
            {roots.map((root) => (
              <OrgNode
                key={root.id}
                user={root}
                subordinates={users.filter((u) => u.reportsTo === root.id)}
                allUsers={users}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
