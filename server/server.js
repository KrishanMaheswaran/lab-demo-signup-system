import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { readJSON, writeJSON } from "./storage.js";
import { TOKEN_SECRET, SALT_ROUNDS } from "./config.js";

import openRoutes from "./routes/open.js";
import secureRoutes from "./routes/secure.js";
import adminRoutes from "./routes/admin.js";
import courseRoutes from "./routes/courses.js";
import memberRoutes from "./routes/members.js";
import sheetRoutes from "./routes/sheets.js";
import slotRoutes from "./routes/slots.js";
import gradeRoutes from "./routes/grades.js";
import studentRoutes from "./routes/students.js";
import { verifyToken } from "./middleware/auth.js";

const app = express();
const PORT = 3000;

/* ----------------------------------------------------
   PATH HELPERS
----------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ----------------------------------------------------
   MIDDLEWARE
----------------------------------------------------- */
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

/* ----------------------------------------------------
   USER AUTH STORAGE FILE
----------------------------------------------------- */
const USERS_FILE = "users.json";

// Initialize default users if file doesn't exist
(async () => {
  const users = await readJSON(USERS_FILE, null);
  if (!users) {
    console.log("Initializing default users...");
    const defaultUsers = [
      {
        "username": "admin",
        "hash": "$2b$10$4J3LgtTlcCxoF2G844m2Te9gOKSayrT.YNQ18O7CDzDnuVz/edoNe", // admin123
        "role": "admin",
        "mustChange": false
      },
      {
        "username": "ta1",
        "hash": "$2b$10$4J3LgtTlcCxoF2G844m2Te9gOKSayrT.YNQ18O7CDzDnuVz/edoNe", // admin123
        "role": "ta",
        "mustChange": false
      },
      {
        "username": "student1",
        "hash": "$2b$10$4J3LgtTlcCxoF2G844m2Te9gOKSayrT.YNQ18O7CDzDnuVz/edoNe", // admin123
        "role": "student",
        "mustChange": true
      }
    ];
    await writeJSON(USERS_FILE, defaultUsers);
  }
})();

/* ----------------------------------------------------
   LOGIN ROUTE (PUBLIC)
----------------------------------------------------- */
app.post("/api/open/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "username and password required" });
  }

  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.hash);

  if (!match) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    TOKEN_SECRET,
    { expiresIn: "2h" }
  );

  user.lastLogin = new Date().toISOString();
  await writeJSON(USERS_FILE, users);

  res.json({
    ok: true,
    token,
    mustChange: user.mustChange === true
  });
});

/* ----------------------------------------------------
   CHANGE PASSWORD (AUTH REQUIRED)
----------------------------------------------------- */
app.post("/api/secure/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ ok: false, error: "oldPassword and newPassword required" });
  }

  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === req.user.username);

  if (!user) return res.status(404).json({ ok: false, error: "User not found" });

  const ok = await bcrypt.compare(oldPassword, user.hash);
  if (!ok) return res.status(401).json({ ok: false, error: "Old password incorrect" });

  user.hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.mustChange = false;

  await writeJSON(USERS_FILE, users);

  res.json({ ok: true });
});

/* ----------------------------------------------------
   ADMIN RESET PASSWORD
----------------------------------------------------- */
app.post("/api/admin/reset-password", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin only" });
  }

  const { username } = req.body || {};
  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);

  if (!user) return res.status(404).json({ ok: false, error: "User not found" });

  user.hash = await bcrypt.hash("changeme123", SALT_ROUNDS);
  user.mustChange = true;

  await writeJSON(USERS_FILE, users);
  res.json({ ok: true, resetTo: "changeme123" });
});

/* ----------------------------------------------------
   API ROUTES
----------------------------------------------------- */
app.use("/api/open", openRoutes);
app.use("/api/secure", verifyToken, secureRoutes);
app.use("/api/secure/members", verifyToken, memberRoutes);
app.use("/api/secure/courses", verifyToken, courseRoutes);
app.use("/api/secure/sheets", verifyToken, sheetRoutes);
app.use("/api/secure/slots", slotRoutes);
app.use("/api/secure/grades", gradeRoutes);
app.use("/api/secure/students", studentRoutes);
app.use("/api/admin", verifyToken, adminRoutes);

/* ----------------------------------------------------
   SERVE REACT BUILD (EXPRESS 5 SAFE)
----------------------------------------------------- */
const clientPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientPath));

app.use((req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

/* ----------------------------------------------------
   START SERVER
----------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
