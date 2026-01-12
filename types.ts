export interface User {
  id: string;
  name: string;
  employeeId: string;
  password?: string;
  photoBase64: string;
  role: "user" | "admin";
  position?: string;
  reportsTo?: string; // ID of the manager
  createdAt: number;
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userPosition?: string;
  userPhoto: string;
  content: string;
  images: string[]; // base64 images
  isAchievement: boolean;
  likes: number;
  comments: number;
  createdAt: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: "Cuti" | "Izin" | "Sakit";
  startDate: string;
  endDate: string;
  reason: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: number;
}

export interface OfficeConfig {
  latitude: number;
  longitude: number;
  maxDistance: number;
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
  ADMIN_LOGIN = "admin_login",
  LEAVE_PANEL = "leave",
  ORG_STRUCTURE = "org_structure",
  PROFILE = "profile",
  FEEDS = "feeds",
}

export interface VerificationResult {
  isMatch: boolean;
  score: number;
  message: string;
}
