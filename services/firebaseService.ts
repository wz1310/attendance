import { initializeApp, getApp, getApps } from "@firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  query,
  orderBy,
  writeBatch,
} from "@firebase/firestore";
import { User, OfficeConfig, AttendanceLog } from "../types";

// Konfigurasi Firebase Default (Hardcoded as requested)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Jxk7AxVGrkuxjTY314v3hFuwgtCpjgU",
  authDomain: "wz-absence.firebaseapp.com",
  projectId: "wz-absence",
  storageBucket: "wz-absence.firebasestorage.app",
  messagingSenderId: "971141848404",
  appId: "1:971141848404:web:d4325613859eebb435bcc1",
};

let db: any = null;

export const initFirebase = (config: any) => {
  try {
    const firebaseConfig = config || DEFAULT_FIREBASE_CONFIG;
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    return true;
  } catch (e) {
    console.error("Firebase Init Error", e);
    return false;
  }
};

const ensureInit = () => {
  if (!db) {
    const savedConfig = localStorage.getItem("FIREBASE_CONFIG");
    const configToUse = savedConfig
      ? JSON.parse(savedConfig)
      : DEFAULT_FIREBASE_CONFIG;
    initFirebase(configToUse);
  }
};

export const firebaseService = {
  async getUsers(): Promise<User[]> {
    ensureInit();
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => d.data() as User);
  },

  async saveUsers(users: User[]): Promise<void> {
    ensureInit();
    const snap = await getDocs(collection(db, "users"));
    const batch = writeBatch(db);

    const newUserIds = new Set(users.map((u) => u.id));
    snap.docs.forEach((docSnap) => {
      if (!newUserIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    for (const user of users) {
      const userRef = doc(db, "users", user.id);
      batch.set(userRef, user);
    }

    await batch.commit();
  },

  async getConfig(): Promise<OfficeConfig> {
    ensureInit();
    const snap = await getDoc(doc(db, "settings", "officeConfig"));
    if (snap.exists()) return snap.data() as OfficeConfig;
    return { latitude: -6.2, longitude: 106.81, maxDistance: 100 };
  },

  async saveConfig(config: OfficeConfig): Promise<void> {
    ensureInit();
    await setDoc(doc(db, "settings", "officeConfig"), config);
  },

  async getLogs(): Promise<AttendanceLog[]> {
    ensureInit();
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AttendanceLog);
  },

  async addLog(log: AttendanceLog): Promise<void> {
    ensureInit();
    await setDoc(doc(db, "logs", log.id), log);
  },

  async updateLogs(logs: AttendanceLog[]): Promise<void> {
    ensureInit();
    const snap = await getDocs(collection(db, "logs"));
    const batch = writeBatch(db);

    const newLogIds = new Set(logs.map((l) => String(l.id)));
    snap.docs.forEach((docSnap) => {
      if (!newLogIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    for (const log of logs) {
      batch.set(doc(db, "logs", String(log.id)), log);
    }

    await batch.commit();
  },

  async checkHealth(): Promise<boolean> {
    try {
      ensureInit();
      await getDoc(doc(db, "settings", "officeConfig"));
      return true;
    } catch {
      return false;
    }
  },
};
