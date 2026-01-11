import { User, OfficeConfig, AttendanceLog } from "../types";
import { firebaseService } from "./firebaseService";

const DEFAULT_ENDPOINT = "https://c1jx4415-3000.asse.devtunnels.ms/api";

export type StorageMode = "LOCAL" | "FIREBASE";

export const getStorageMode = (): StorageMode => {
  // Jika belum pernah diset, secara logis kita anggap LOCAL dulu sampai dicek oleh App.tsx
  return (localStorage.getItem("STORAGE_MODE") as StorageMode) || "LOCAL";
};

export const setStorageMode = (mode: StorageMode) => {
  localStorage.setItem("STORAGE_MODE", mode);
};

export const getApiBase = () => {
  return localStorage.getItem("SERVER_ENDPOINT") || DEFAULT_ENDPOINT;
};

export const setApiBase = (url: string) => {
  localStorage.setItem("SERVER_ENDPOINT", url);
};

const headers = {
  "Content-Type": "application/json",
};

export const apiService = {
  async checkHealth(customUrl?: string): Promise<boolean> {
    const targetUrl = customUrl || getApiBase();
    try {
      // Pengecekan kesehatan server lokal
      const res = await fetch(`${targetUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000), // Timeout cepat agar transisi ke Firebase tidak lama
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getUsers(): Promise<User[]> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getUsers();
    const res = await fetch(`${getApiBase()}/users`, { headers });
    return res.json();
  },

  async saveUsers(users: User[]): Promise<void> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.saveUsers(users);
    await fetch(`${getApiBase()}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(users),
    });
  },

  async getConfig(): Promise<OfficeConfig> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getConfig();
    const res = await fetch(`${getApiBase()}/config`, { headers });
    return res.json();
  },

  async saveConfig(config: OfficeConfig): Promise<void> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.saveConfig(config);
    await fetch(`${getApiBase()}/config`, {
      method: "POST",
      headers,
      body: JSON.stringify(config),
    });
  },

  async getLogs(): Promise<AttendanceLog[]> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getLogs();
    const res = await fetch(`${getApiBase()}/logs`, { headers });
    return res.json();
  },

  async addLog(log: AttendanceLog): Promise<void> {
    if (getStorageMode() === "FIREBASE") return firebaseService.addLog(log);
    await fetch(`${getApiBase()}/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify(log),
    });
  },

  async updateLogs(logs: AttendanceLog[]): Promise<void> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.updateLogs(logs);
    await fetch(`${getApiBase()}/logs/update`, {
      method: "POST",
      headers,
      body: JSON.stringify(logs),
    });
  },

  async saveEndpoint(endpoint: string): Promise<void> {
    localStorage.setItem("SERVER_ENDPOINT", endpoint);
  },
};
