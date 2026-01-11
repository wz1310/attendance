export interface User {
  id: string;
  name: string;
  employeeId: string;
  password?: string; // Menambahkan password (opsional agar tidak merusak data lama)
  photoBase64: string;
  createdAt: number;
}

export interface OfficeConfig {
  latitude: number;
  longitude: number;
  maxDistance: number; // in meters
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  status: "SUCCESS" | "FAILED";
  reason?: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
  capturedPhoto: string;
}

export enum AppRoute {
  USER_PANEL = "user",
  ADMIN_PANEL = "admin",
  LOGIN = "login",
}

export interface VerificationResult {
  isMatch: boolean;
  score: number;
  message: string;
}
