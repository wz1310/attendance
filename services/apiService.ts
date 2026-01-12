import {
  User,
  OfficeConfig,
  AttendanceLog,
  LeaveRequest,
  FeedPost,
  DailyActivity,
} from "../types";
import { firebaseService } from "./firebaseService";

const DEFAULT_ENDPOINT = "https://c1jx4415-3000.asse.devtunnels.ms/api";
export type StorageMode = "LOCAL" | "FIREBASE";

export const getStorageMode = (): StorageMode =>
  (localStorage.getItem("STORAGE_MODE") as StorageMode) || "LOCAL";
export const setStorageMode = (mode: StorageMode) =>
  localStorage.setItem("STORAGE_MODE", mode);
export const getApiBase = () =>
  localStorage.getItem("SERVER_ENDPOINT") || DEFAULT_ENDPOINT;

const headers = { "Content-Type": "application/json" };

export const apiService = {
  async checkHealth(customUrl?: string): Promise<boolean> {
    try {
      const res = await fetch(`${customUrl || getApiBase()}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getUsers(): Promise<User[]> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getUsers();
    return (await fetch(`${getApiBase()}/users`, { headers })).json();
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
    return (await fetch(`${getApiBase()}/config`, { headers })).json();
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
    return (await fetch(`${getApiBase()}/logs`, { headers })).json();
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

  // LEAVE REQUESTS
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.getLeaveRequests();
    return (await fetch(`${getApiBase()}/leaves`, { headers })).json();
  },

  async updateLeaveRequests(leaves: LeaveRequest[]): Promise<void> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.updateLeaveRequests(leaves);
    await fetch(`${getApiBase()}/leaves/update`, {
      method: "POST",
      headers,
      body: JSON.stringify(leaves),
    });
  },

  // FEEDS
  async getFeeds(): Promise<FeedPost[]> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getFeeds();
    return (await fetch(`${getApiBase()}/feeds`, { headers })).json();
  },

  async addFeed(post: FeedPost): Promise<void> {
    if (getStorageMode() === "FIREBASE") return firebaseService.addFeed(post);
    await fetch(`${getApiBase()}/feeds`, {
      method: "POST",
      headers,
      body: JSON.stringify(post),
    });
  },

  // DAILY ACTIVITIES
  async getActivities(): Promise<DailyActivity[]> {
    if (getStorageMode() === "FIREBASE") return firebaseService.getActivities();
    return (await fetch(`${getApiBase()}/activities`, { headers })).json();
  },

  async addActivity(activity: DailyActivity): Promise<void> {
    if (getStorageMode() === "FIREBASE")
      return firebaseService.addActivity(activity);
    await fetch(`${getApiBase()}/activities`, {
      method: "POST",
      headers,
      body: JSON.stringify(activity),
    });
  },

  async saveEndpoint(endpoint: string): Promise<void> {
    localStorage.setItem("SERVER_ENDPOINT", endpoint);
  },
};
