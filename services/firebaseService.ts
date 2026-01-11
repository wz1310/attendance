import { initializeApp, getApp, getApps } from "firebase/app";
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
} from "firebase/firestore";
import { User, OfficeConfig, AttendanceLog } from "../types";

let db: any = null;

export const initFirebase = (config: any) => {
  try {
    // Gunakan app yang sudah ada jika tersedia untuk menghindari error re-initialization
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
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
    if (savedConfig) initFirebase(JSON.parse(savedConfig));
    else throw new Error("Firebase not configured");
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

    // 1. Identifikasi ID yang harus dihapus
    const newUserIds = new Set(users.map((u) => u.id));
    snap.docs.forEach((docSnap) => {
      if (!newUserIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // 2. Update atau tambah data yang ada
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

    // 1. Identifikasi ID Log yang harus dihapus
    const newLogIds = new Set(logs.map((l) => String(l.id)));
    snap.docs.forEach((docSnap) => {
      if (!newLogIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // 2. Update atau simpan sisa log
    for (const log of logs) {
      batch.set(doc(db, "logs", String(log.id)), log);
    }

    await batch.commit();
  },

  async checkHealth(): Promise<boolean> {
    try {
      ensureInit();
      // Tes sederhana dengan mengambil satu dokumen settings
      await getDoc(doc(db, "settings", "officeConfig"));
      return true;
    } catch {
      return false;
    }
  },
};
