const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db");

// Middleware Logging
app.use((req, res, next) => {
  console.log(
    `[REQUEST] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`
  );
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Tunnel-Skip-AntiPhishing-Page",
    ],
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Inisialisasi Database JSON
async function initDB() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    const files = ["users.json", "config.json", "logs.json", "koneksi.json"];
    for (const file of files) {
      const filePath = path.join(DB_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        let initialData = "[]";
        if (file === "config.json") {
          initialData = JSON.stringify({
            latitude: -6.2,
            longitude: 106.81,
            maxDistance: 100,
          });
        } else if (file === "koneksi.json") {
          initialData = JSON.stringify({
            endpoint: "https://c1jx4415-3000.asse.devtunnels.ms/api",
          });
        }
        await fs.writeFile(filePath, initialData);
        console.log(`[INIT] Membuat database: ${file}`);
      }
    }
    console.log("✅ Database Lokal Siap");
  } catch (err) {
    console.error("❌ Gagal inisialisasi:", err);
  }
}

initDB();

async function readJSON(filename) {
  try {
    const data = await fs.readFile(path.join(DB_PATH, filename), "utf8");
    return JSON.parse(data);
  } catch (err) {
    return file === "config.json" || file === "koneksi.json" ? {} : [];
  }
}

async function writeJSON(filename, data) {
  await fs.writeFile(
    path.join(DB_PATH, filename),
    JSON.stringify(data, null, 2)
  );
}

// --- API ROUTES ---

// ENDPOINT SETTINGS
app.get("/api/endpoint", async (req, res) => {
  const data = await readJSON("koneksi.json");
  res.json(data);
});

app.post("/api/endpoint", async (req, res) => {
  await writeJSON("koneksi.json", req.body);
  res.json({ success: true });
});

// USERS
app.get("/api/users", async (req, res) => {
  const data = await readJSON("users.json");
  res.json(data);
});

app.post("/api/users", async (req, res) => {
  await writeJSON("users.json", req.body);
  res.json({ success: true });
});

// CONFIG
app.get("/api/config", async (req, res) => {
  const data = await readJSON("config.json");
  res.json(data);
});

app.post("/api/config", async (req, res) => {
  await writeJSON("config.json", req.body);
  res.json({ success: true });
});

// LOGS
app.get("/api/logs", async (req, res) => {
  const data = await readJSON("logs.json");
  res.json(data);
});

app.post("/api/logs/update", async (req, res) => {
  try {
    await writeJSON("logs.json", req.body);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/logs", async (req, res) => {
  const logs = await readJSON("logs.json");
  logs.unshift(req.body);
  await writeJSON("logs.json", logs);
  res.json({ success: true });
});

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
