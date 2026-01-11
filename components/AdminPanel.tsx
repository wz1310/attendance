
import React, { useState, useMemo, useEffect } from 'react';
import { User, OfficeConfig, AttendanceLog } from '../types';
import CameraCapture from './CameraCapture';
import { isFaceDetected } from '../services/faceApiService';
import { apiService, getApiBase, getStorageMode, setStorageMode } from '../services/apiService';
import { initFirebase } from '../services/firebaseService';
import './css/adminpanel.css';

interface AdminPanelProps {
  users: User[];
  config: OfficeConfig;
  logs: AttendanceLog[];
  onUpdateUsers: (users: User[]) => void;
  onUpdateConfig: (config: OfficeConfig) => void;
  onUpdateLogs: (logs: AttendanceLog[]) => Promise<void>;
  onBack: () => void;
}

type GroupMode = 'none' | 'name' | 'date';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, 
  config, 
  logs,
  onUpdateUsers, 
  onUpdateConfig, 
  onUpdateLogs,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'settings'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupMode, setGroupMode] = useState<GroupMode>('none');
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTarget, setModalTarget] = useState<'logs' | 'users'>('logs');
  
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Storage Settings
  const [storageMode, setStorageModeState] = useState(getStorageMode());
  const [serverUrl, setServerUrl] = useState(getApiBase());
  const [fbConfigStr, setFbConfigStr] = useState(localStorage.getItem('FIREBASE_CONFIG') || '');
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false);
  const [showErrorWidget, setShowErrorWidget] = useState(false);

  useEffect(() => {
    setServerUrl(getApiBase());
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingEndpoint(true);
    try {
      if (storageMode === 'FIREBASE') {
        const configObj = JSON.parse(fbConfigStr);
        const success = initFirebase(configObj);
        if (!success) throw new Error("Invalid Firebase Config");
        localStorage.setItem('FIREBASE_CONFIG', fbConfigStr);
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

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const isAllLogsSelected = useMemo(() => {
    return filteredLogs.length > 0 && filteredLogs.every(log => selectedLogIds.includes(String(log.id)));
  }, [filteredLogs, selectedLogIds]);

  const handleSelectAllLogs = () => {
    if (isAllLogsSelected) {
      const filteredIds = filteredLogs.map(log => String(log.id));
      setSelectedLogIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredLogs.map(log => String(log.id));
      setSelectedLogIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const groupedLogs = useMemo(() => {
    if (groupMode === 'none') return { 'All Logs': filteredLogs };
    const groups: { [key: string]: AttendanceLog[] } = {};
    
    filteredLogs.forEach(log => {
      let key = '';
      if (groupMode === 'name') key = log.userName;
      else if (groupMode === 'date') key = new Date(log.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [filteredLogs, groupMode]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => l.status === 'SUCCESS').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, success, failed: total - success, successRate };
  }, [logs]);

  const handleSelectLog = (id: string) => {
    setSelectedLogIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openConfirmModal = (target: 'logs' | 'users') => {
    setModalTarget(target);
    setShowConfirmModal(true);
  };

  const executeDelete = async () => {
    setShowConfirmModal(false);
    setIsDeleting(true);
    try {
      if (modalTarget === 'logs') {
        const remainingLogs = logs.filter(log => !selectedLogIds.includes(String(log.id)));
        await onUpdateLogs(remainingLogs);
        setSelectedLogIds([]);
      } else {
        const remainingUsers = users.filter(user => !selectedUserIds.includes(String(user.id)));
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
      password: password,
      photoBase64: photo,
      createdAt: Date.now()
    };
    onUpdateUsers([...users, newUser]);
    setIsRegistering(false);
    setName(''); setEmpId(''); setPhoto(null); setPassword('');
  };

  const handlePhotoCapture = async (b64: string) => {
    setIsValidating(true);
    const detected = await isFaceDetected(b64);
    setIsValidating(false);
    if (detected) setPhoto(b64);
    else alert("Wajah tidak terdeteksi!");
  };

  return (
    <div className="admin-root">
      
      {showErrorWidget && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/20 backdrop-blur-md" onClick={() => setShowErrorWidget(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative w-full max-w-sm border border-red-50 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tighter mb-2">Save Failed</h3>
            <p className="text-slate-400 text-[10px] text-center mb-8 font-bold uppercase tracking-widest leading-relaxed">Pastikan konfigurasi atau URL server benar dan aktif.</p>
            <button onClick={() => setShowErrorWidget(false)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Tutup</button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}></div>
          <div className="modal-card animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-800 text-center uppercase">Konfirmasi Hapus</h3>
            <p className="text-slate-500 text-xs text-center mt-2 leading-relaxed">Hapus <span className="font-bold text-red-600">{modalTarget === 'logs' ? selectedLogIds.length : selectedUserIds.length}</span> data terpilih?</p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={executeDelete} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]">Ya, Hapus</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold uppercase text-[10px]">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white text-[9px] font-black uppercase tracking-widest">Processing...</p>
          </div>
        </div>
      )}

      <header className="admin-header">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-full">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h2 className="text-sm md:text-lg font-bold text-slate-800 leading-tight">Admin Portal</h2>
              <div className="admin-tab-group no-scrollbar">
                {['dashboard', 'logs', 'users', 'settings'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`admin-tab-btn ${activeTab === tab ? 'active' : 'inactive'}`}>{tab}</button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="admin-search-box">
              <input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[ {l: 'Total Logs', v: stats.total, c: 'slate-800'}, {l: 'Success Rate', v: `${stats.successRate}%`, c: 'green-600'}, {l: 'Absen OK', v: stats.success, c: 'indigo-600'}, {l: 'Storage Mode', v: storageMode, c: 'orange-600'} ].map((s,i) => (
                <div key={i} className="bg-white p-4 rounded-xl border shadow-sm text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.l}</p>
                  <h4 className={`text-xl md:text-2xl font-black text-${s.c}`}>{s.v}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="admin-table-wrapper">
             <div className="bg-white py-2 border-b flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-11 md:w-11 flex justify-center">
                  <input type="checkbox" checked={isAllLogsSelected} onChange={handleSelectAllLogs} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                </div>
                <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mr-3">Aktivitas Terbaru</p>
                <div className="relative">
                    <button onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${groupMode !== 'none' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                      Group: {groupMode}
                    </button>
                    {isGroupMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-xl z-[100] py-1 min-w-[120px] animate-in slide-in-from-top-2">
                           {(['none', 'name', 'date'] as GroupMode[]).map(mode => (
                             <button key={mode} onClick={() => { setGroupMode(mode); setIsGroupMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase hover:bg-slate-50 ${groupMode === mode ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-500'}`}>{mode}</button>
                           ))}
                        </div>
                    )}
                </div>
              </div>
              <div className="pr-4 md:pr-6">
                {selectedLogIds.length > 0 && (
                  <button onClick={() => openConfirmModal('logs')} className="p-1 bg-red-50 text-red-600 rounded border border-red-100 animate-in zoom-in-95">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="admin-table-container admin-custom-scrollbar">
              <table className="admin-table">
                <thead className="admin-thead">
                  <tr>
                    <th className="px-3 py-3 w-8 text-center">#</th>
                    <th className="px-2 py-3">Nama</th>
                    <th className="px-2 py-3">Waktu</th>
                    <th className="px-2 py-3 text-center">GPS</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody divide-y divide-slate-100">
                  {Object.entries(groupedLogs).map(([groupKey, groupItems]) => (
                    <React.Fragment key={groupKey}>
                      {groupMode !== 'none' && (
                        <tr className="bg-slate-50/80 backdrop-blur-sm sticky top-[36px] z-[30]">
                          <td colSpan={4} className="px-4 py-1.5 text-[8px] font-black text-indigo-500 uppercase tracking-widest border-y border-slate-100">
                            <span className="opacity-50 mr-1">Group:</span> {groupKey} ({groupItems.length})
                          </td>
                        </tr>
                      )}
                      {groupItems.map(log => {
                        const isS = selectedLogIds.includes(String(log.id));
                        const logDate = new Date(log.timestamp);
                        return (
                          <tr key={log.id} className={`hover:bg-[#F8F9FA] transition-colors ${isS ? 'bg-indigo-50/40' : ''}`}>
                            <td className="px-3 py-2 text-center"><input type="checkbox" checked={isS} onChange={() => handleSelectLog(String(log.id))} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer" /></td>
                            <td className="px-2 py-2 flex items-center gap-2">
                              <img src={log.capturedPhoto} className="w-7 h-7 md:w-10 md:h-10 rounded-lg object-cover border" alt="" />
                              <div className="min-w-0"><p className="font-bold truncate text-slate-800">{log.userName}</p><p className="text-[8px] text-slate-400 font-mono">{log.userId}</p></div>
                            </td>
                            <td className="px-2 py-2 log-time-display">
                              <span className="log-time-bold">{logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}</span>
                              <span className="log-time-separator">|</span>
                              <span className="log-date-normal">{logDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                            </td>
                            <td className="px-2 py-2 text-center">
                               <div className="gps-icon-wrapper">
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                 <div className="tooltip-box animate-in fade-in zoom-in-95">
                                   <div className="tooltip-content">{log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}</div>
                                   <div className="tooltip-arrow"></div>
                                 </div>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-4 md:p-8 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Karyawan ({users.length})</h3>
              <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">+ Baru</button>
            </div>
            
            {isRegistering ? (
              <div className="bg-white p-6 rounded-2xl border shadow-lg max-w-2xl mx-auto animate-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <input type="text" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <input type="text" placeholder="ID Pegawai (NIK)" value={empId} onChange={e => setEmpId(e.target.value)} className="w-full bg-white border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <input type="password" placeholder="Password Login" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <div className="flex gap-2">
                        <button onClick={handleRegister} disabled={!name || !empId || !photo || !password} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-[9px] uppercase disabled:bg-slate-300">Simpan</button>
                        <button onClick={() => setIsRegistering(false)} className="px-4 border py-3 rounded-xl font-black text-[9px] uppercase">Batal</button>
                    </div>
                  </div>
                  <div>{photo ? <div className="relative rounded-xl overflow-hidden shadow-md"><img src={photo} className="w-full h-32 object-cover" /><button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div> : <CameraCapture onCapture={handlePhotoCapture} label="Ambil Foto Master" />}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-white border p-3 rounded-xl flex items-center gap-3 relative transition-all group">
                    <img src={user.photoBase64} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[11px] truncate leading-tight">{user.name}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{user.employeeId}</p>
                    </div>
                    <button onClick={() => { setSelectedUserIds([String(user.id)]); openConfirmModal('users'); }} className="text-slate-300 hover:text-red-500 p-1 opacity-40 group-hover:opacity-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 md:p-8 overflow-y-auto space-y-6">
            {/* Storage Selection */}
            <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow-sm space-y-4">
               <div className="text-center">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Penyimpanan Utama</h3>
                 <p className="text-[8px] text-slate-400 leading-tight">Pilih sumber database (Dual Mode)</p>
               </div>
               <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                 <button onClick={() => setStorageModeState('LOCAL')} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${storageMode === 'LOCAL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Node.js (Local)</button>
                 <button onClick={() => setStorageModeState('FIREBASE')} className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${storageMode === 'FIREBASE' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Firebase (Cloud)</button>
               </div>

               {storageMode === 'LOCAL' ? (
                 <div className="space-y-3 pt-2">
                    <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://.../api" className="w-full bg-slate-50 border rounded-lg px-4 py-3 text-[11px] font-bold outline-none" />
                    <button onClick={handleSaveSettings} disabled={isSavingEndpoint} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">{isSavingEndpoint ? 'Connecting...' : 'Update Local Server'}</button>
                 </div>
               ) : (
                 <div className="space-y-3 pt-2">
                    <textarea value={fbConfigStr} onChange={e => setFbConfigStr(e.target.value)} placeholder='Paste firebaseConfig object here...' className="w-full bg-slate-50 border rounded-lg px-4 py-3 text-[10px] font-mono h-32 outline-none resize-none" />
                    <button onClick={handleSaveSettings} disabled={isSavingEndpoint} className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">{isSavingEndpoint ? 'Connecting...' : 'Update Firebase Cloud'}</button>
                    <p className="text-[7px] text-center text-slate-400">Dapatkan di: Firebase Console lalu Project Settings lalu General</p>
                 </div>
               )}
            </div>

            <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="text-center"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geofencing</h3><p className="text-slate-400 text-[8px]">Koordinat Pusat Absen Kantor</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Latitude</label><input type="number" step="any" value={config.latitude} onChange={e => onUpdateConfig({...config, latitude: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-[11px] font-bold" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Longitude</label><input type="number" step="any" value={config.longitude} onChange={e => onUpdateConfig({...config, longitude: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-[11px] font-bold" /></div>
              </div>
              <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase block text-center">Radius (Meter)</label><input type="number" value={config.maxDistance} onChange={e => onUpdateConfig({...config, maxDistance: parseInt(e.target.value) || 10})} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-center text-lg font-black" /></div>
              <button onClick={() => navigator.geolocation.getCurrentPosition(pos => onUpdateConfig({...config, latitude: pos.coords.latitude, longitude: pos.coords.longitude}))} className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Gunakan Lokasi Saya</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
