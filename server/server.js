const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db");

app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] })
);
app.use(bodyParser.json({ limit: "50mb" }));

async function initDB() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    const files = [
      "users.json",
      "config.json",
      "logs.json",
      "leaves.json",
      "feeds.json",
      "activities.json",
    ];
    for (const file of files) {
      const filePath = path.join(DB_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        let initialData =
          file === "config.json"
            ? JSON.stringify({
                latitude: -6.2,
                longitude: 106.81,
                maxDistance: 100,
              })
            : "[]";
        await fs.writeFile(filePath, initialData);
      }
    }
    console.log("✅ Database Lokal Siap");
  } catch (err) {
    console.error("❌ Gagal:", err);
  }
}
initDB();

async function readJSON(filename) {
  const data = await fs.readFile(path.join(DB_PATH, filename), "utf8");
  return JSON.parse(data);
}
async function writeJSON(filename, data) {
  await fs.writeFile(
    path.join(DB_PATH, filename),
    JSON.stringify(data, null, 2)
  );
}

app.get("/api/users", async (req, res) =>
  res.json(await readJSON("users.json"))
);
app.post("/api/users", async (req, res) => {
  await writeJSON("users.json", req.body);
  res.json({ success: true });
});
app.get("/api/config", async (req, res) =>
  res.json(await readJSON("config.json"))
);
app.post("/api/config", async (req, res) => {
  await writeJSON("config.json", req.body);
  res.json({ success: true });
});
app.get("/api/logs", async (req, res) => res.json(await readJSON("logs.json")));
app.post("/api/logs", async (req, res) => {
  const logs = await readJSON("logs.json");
  logs.unshift(req.body);
  await writeJSON("logs.json", logs);
  res.json({ success: true });
});
app.post("/api/logs/update", async (req, res) => {
  await writeJSON("logs.json", req.body);
  res.json({ success: true });
});

// LEAVES API
app.get("/api/leaves", async (req, res) =>
  res.json(await readJSON("leaves.json"))
);
app.post("/api/leaves/update", async (req, res) => {
  await writeJSON("leaves.json", req.body);
  res.json({ success: true });
});

// FEEDS API
app.get("/api/feeds", async (req, res) => {
  const feeds = await readJSON("feeds.json");
  res.json(feeds);
});
app.post("/api/feeds", async (req, res) => {
  const feeds = await readJSON("feeds.json");
  feeds.unshift(req.body);
  await writeJSON("feeds.json", feeds);
  res.json({ success: true });
});

// ACTIVITIES API
app.get("/api/activities", async (req, res) => {
  const activities = await readJSON("activities.json");
  res.json(activities);
});
app.post("/api/activities", async (req, res) => {
  const activities = await readJSON("activities.json");
  activities.unshift(req.body);
  await writeJSON("activities.json", activities);
  res.json({ success: true });
});
// Update Activities API (for Deletion or Batch Update)
app.post("/api/activities/update", async (req, res) => {
  await writeJSON("activities.json", req.body);
  res.json({ success: true });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server on port ${PORT}`));
