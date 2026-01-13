
import React from 'react';
import { User } from '../types';

interface OrgNodeProps {
  user: User;
  subordinates: User[];
  allUsers: User[];
}

const OrgNode: React.FC<OrgNodeProps> = ({ user, subordinates, allUsers }) => {
  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className="group relative z-10">
        <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-500/5 min-w-[140px] sm:min-w-[180px] md:min-w-[220px] transition-all hover:scale-105 hover:border-indigo-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2 md:mb-3">
              <img 
                src={user.photoBase64} 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] object-cover ring-2 md:ring-4 ring-indigo-50 shadow-md" 
                alt={user.name} 
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-indigo-600 border-2 md:border-4 border-white rounded-full"></div>
            </div>
            <h4 className="text-[10px] sm:text-[11px] md:text-[13px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1 truncate max-w-full">
              {user.name}
            </h4>
            <div className="bg-indigo-50 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
              <span className="text-[7px] md:text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                {user.position || 'Employee'}
              </span>
            </div>
            <p className="text-[7px] md:text-[8px] text-slate-400 font-bold mt-1.5 md:mt-2 uppercase tracking-widest">{user.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Connection Down */}
      {subordinates.length > 0 && (
        <div className="h-6 md:h-10 w-0.5 bg-indigo-100 relative">
          <div className="absolute bottom-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-200 rounded-full left-1/2 -translate-x-1/2"></div>
        </div>
      )}

      {/* Children Container */}
      {subordinates.length > 0 && (
        <div className="flex gap-4 md:gap-8 relative pt-2">
          {/* Horizontal Connector Line */}
          {subordinates.length > 1 && (
            <div 
              className="absolute top-0 left-[50%] -translate-x-1/2 h-0.5 bg-indigo-100" 
              style={{ 
                width: 'calc(100% - var(--node-width, 140px))'
              }} 
            />
          )}
          
          {subordinates.map((sub) => (
            <div key={sub.id} className="relative">
              {/* Vertical Connector to Child */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-indigo-100"></div>
              <OrgNode 
                user={sub} 
                subordinates={allUsers.filter(u => u.reportsTo === sub.id)} 
                allUsers={allUsers} 
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Inject custom property for dynamic connector width using CSS Variables */}
      <style>{`
        :root {
          --node-width: 140px;
        }
        @media (min-width: 640px) {
          :root { --node-width: 180px; }
        }
        @media (min-width: 768px) {
          :root { --node-width: 220px; }
        }
      `}</style>
    </div>
  );
};

// Fixed missing OrgChartProps definition
interface OrgChartProps {
  users: User[];
  onBack: () => void;
}

const OrgChart: React.FC<OrgChartProps> = ({ users, onBack }) => {
  // Find top-level managers
  const roots = users.filter(u => !u.reportsTo || !users.find(manager => manager.id === u.reportsTo));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">Organization Structure</h1>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Hierarchy Mapping</p>
          </div>
        </div>
        
        <div className="bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
           <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">{users.length} Active Members</span>
        </div>
      </header>

      {/* Scrollable Container with centering flex */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50 p-6 md:p-12 lg:p-20">
        <div className="min-w-max flex justify-center pb-20">
          <div className="space-y-16 md:space-y-24">
            {roots.length > 0 ? (
              roots.map(root => (
                <OrgNode 
                  key={root.id} 
                  user={root} 
                  subordinates={users.filter(u => u.reportsTo === root.id)} 
                  allUsers={users} 
                />
              ))
            ) : (
              <div className="text-center py-20 bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No users found to build chart</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
