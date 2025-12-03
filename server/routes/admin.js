import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { readJSON, writeJSON } from "../storage.js";

const router = express.Router();
const USERS_FILE = "users.json";

// All admin routes require admin role
router.use(verifyToken);
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }
  next();
});

// Add TA role to a user
router.post("/add-ta", async (req, res) => {
  const { username } = req.body || {};

  if (!username) {
    return res.status(400).json({ ok: false, error: "Username required" });
  }

  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  if (user.role === "ta") {
    return res.status(400).json({ ok: false, error: "User is already a TA" });
  }

  user.role = "ta";
  await writeJSON(USERS_FILE, users);

  res.json({ ok: true, message: `User ${username} is now a TA` });
});

// Remove TA role from a user
router.post("/remove-ta", async (req, res) => {
  const { username } = req.body || {};

  if (!username) {
    return res.status(400).json({ ok: false, error: "Username required" });
  }

  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  if (user.role !== "ta") {
    return res.status(400).json({ ok: false, error: "User is not a TA" });
  }

  user.role = "student";
  await writeJSON(USERS_FILE, users);

  res.json({ ok: true, message: `Removed TA role from ${username}` });
});

export default router;
