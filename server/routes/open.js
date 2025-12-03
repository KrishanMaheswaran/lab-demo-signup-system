import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readJSON, writeJSON } from "../storage.js";
import { TOKEN_SECRET, SALT_ROUNDS } from "../config.js";
import { loadDB } from "../models/db.js";

const router = express.Router();
const USERS_FILE = "users.json";

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  const users = await readJSON(USERS_FILE, []);
  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ ok: false, error: "Email already exists" });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    id: users.length + 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hash,
    role: "user"
  };

  users.push(user);
  await writeJSON(USERS_FILE, users);

  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.email === (email || "").toLowerCase());

  if (!user) return res.status(401).json({ ok: false, error: "Invalid login" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid login" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    TOKEN_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ ok: true, token });
});

// Search courses by code (unauthenticated)
router.get("/search", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ ok: false, error: "Course code required" });
  }

  const db = await loadDB();
  const searchTerm = code.toLowerCase().trim();

  // Find courses containing the search term (case-insensitive)
  const matchingCourses = db.courses.filter(c =>
    c.code.toLowerCase().includes(searchTerm)
  );

  // For each course, get signup sheets and slots
  const results = matchingCourses.map(course => {
    const sheets = db.sheets.filter(s => s.courseId === course.id);

    const sheetsWithSlots = sheets.map(sheet => {
      const slots = db.slots.filter(s => s.sheetId === sheet.id);

      const slotsWithDetails = slots.map(slot => ({
        ...slot,
        signupCount: slot.signupMemberIds.length,
        capacity: slot.maxMembers
      }));

      return {
        ...sheet,
        slots: slotsWithDetails
      };
    });

    return {
      course,
      sheets: sheetsWithSlots
    };
  });

  res.json({ ok: true, results });
});

export default router;
