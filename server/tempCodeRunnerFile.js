import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import { readJSON, writeJSON } from "./storage.js";
import {
  validateCourse,            // not used here but fine to keep
  isIntInRange,
  sanitizeText,              // not used here but fine to keep
  sanitizeFixed,             // validateMember uses this internally in your lib; keeping import is fine
  validateMember,
  validateGradeInput,
  validateSheetInput,
  validateSlotsInput,
  validateSlotPatch
} from "./validate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50kb" }));

// Serve client
app.use(express.static(path.join(__dirname, "../client")));

// Heartbeat
app.get("/api/test", (_req, res) => {
  res.json({ ok: true, message: "Server running successfully" });
});

// ----------------- Courses & Members (1.a–1.f) -----------------
const COURSES_FILE = "courses.json";

// 1.a Create course
app.post("/api/courses", async (req, res) => {
  const { term, name, section = 1 } = req.body || {};
  const t = Number(term), s = Number(section);
  const nm = (typeof name === "string" ? name : "").slice(0, 100).trim();

  const errors = [];
  if (!isIntInRange(t, 1, 9999)) errors.push("term (1–9999) is required");
  if (!isIntInRange(s, 1, 99))   errors.push("section (1–99) is required");
  if (!nm)                       errors.push("name (<=100 chars) is required");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const courses = await readJSON(COURSES_FILE, []);
  if (courses.find(c => c.term === t && c.section === s)) {
    return res.status(409).json({ ok: false, error: "Course with same term & section exists." });
  }
  courses.push({ term: t, section: s, name: nm, members: [] });
  await writeJSON(COURSES_FILE, courses);
  res.status(201).json({ ok: true, course: { term: t, section: s, name: nm } });
});

// 1.b List courses
app.get("/api/courses", async (_req, res) => {
  const courses = await readJSON(COURSES_FILE, []);
  res.json({ ok: true, courses });
});

// 1.c Delete course
app.delete("/api/courses", async (req, res) => {
  const t = Number(req.query.term);
  const s = Number(req.query.section ?? 1);
  if (!isIntInRange(t, 1, 9999) || !isIntInRange(s, 1, 99)) {
    return res.status(400).json({ ok: false, error: "term (1–9999) and section (1–99) required." });
  }
  const courses = await readJSON(COURSES_FILE, []);
  const idx = courses.findIndex(c => c.term === t && c.section === s);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Course not found." });

  const [removed] = courses.splice(idx, 1);
  await writeJSON(COURSES_FILE, courses);
  res.json({ ok: true, removed });
});

// ---------- API: members (1.d–1.f) ----------

// 1.d Add members
app.post("/api/courses/members", async (req, res) => {
  const { term, section = 1, list } = req.body || {};
  const t = Number(term), s = Number(section);
  if (!isIntInRange(t, 1, 9999) || !isIntInRange(s, 1, 99) || !Array.isArray(list)) {
    return res.status(400).json({ ok: false, error: "term(1–9999), section(1–99) and list[]=members are required." });
  }
  const courses = await readJSON(COURSES_FILE, []);
  const course = courses.find(c => c.term === t && c.section === s);
  if (!course) return res.status(404).json({ ok: false, error: "Course not found." });

  course.members ||= [];
  const have = new Set(course.members.map(m => m.id));
  let added = 0; const ignored = [];
  for (const raw of list) {
    const v = validateMember(raw);
    if (!v.ok) { ignored.push({ input: raw?.id ?? raw, errors: v.errors }); continue; }
    if (have.has(v.value.id)) { ignored.push(v.value.id); continue; }
    course.members.push(v.value); have.add(v.value.id); added++;
  }
  await writeJSON(COURSES_FILE, courses);
  res.status(201).json({ ok: true, added, ignored });
});

// 1.e List members (optional filter by role)
app.get("/api/courses/members", async (req, res) => {
  const t = Number(req.query.term);
  const s = Number(req.query.section ?? 1);
  const role = String(req.query.role ?? "").trim().toLowerCase();
  if (!isIntInRange(t, 1, 9999) || !isIntInRange(s, 1, 99)) {
    return res.status(400).json({ ok: false, error: "term(1–9999) and section(1–99) required." });
  }
  const courses = await readJSON(COURSES_FILE, []);
  const course = courses.find(c => c.term === t && c.section === s);
  if (!course) return res.status(404).json({ ok: false, error: "Course not found." });

  const members = (course.members || []).filter(m => !role || (m.role || "").toLowerCase() === role);
  res.json({ ok: true, members });
});

// 1.f Delete members by id[]
app.delete("/api/courses/members", async (req, res) => {
  const { term, section = 1, list } = req.body || {};
  const t = Number(term), s = Number(section);
  if (!isIntInRange(t, 1, 9999) || !isIntInRange(s, 1, 99) || !Array.isArray(list)) {
    return res.status(400).json({ ok: false, error: "term(1–9999), section(1–99) and list[]=ids required." });
  }
  const courses = await readJSON(COURSES_FILE, []);
  const course = courses.find(c => c.term === t && c.section === s);
  if (!course) return res.status(404).json({ ok: false, error: "Course not found." });

  const ids = new Set(list.map(String));
  const before = course.members?.length || 0;
  course.members = (course.members || []).filter(m => !ids.has(String(m.id)));
  const removed = before - (course.members?.length || 0);
  await writeJSON(COURSES_FILE, courses);
  res.json({ ok: true, removed });
});

// ----------------- Sheets/Slots/Signups (2.a–2.h) -----------------
const SHEETS_FILE = "sheets.json";

// helpers
function nextId(items) {
  let max = 0;
  for (const it of items) max = Math.max(max, Number(it.id) || 0);
  return max + 1;
}
function findSheet(sheets, id) {
  return sheets.find(s => Number(s.id) === Number(id));
}

// 2.a Create a signup sheet
app.post("/api/sheets", async (req, res) => {
  const { ok, value, errors } = validateSheetInput(req.body || {});
  if (!ok) return res.status(400).json({ ok: false, errors });

  const sheets = await readJSON(SHEETS_FILE, []);
  const newSheet = {
    id: nextId(sheets),
    term: value.term,
    section: value.section,
    assignment: value.assignment,
    notBefore: value.notBefore,
    notAfter: value.notAfter,
    slots: [],           // {id,start,slotDuration,maxMembers,members:[]}
    grades: {}           // { [memberId]: { grade, comment } }
  };
  sheets.push(newSheet);
  await writeJSON(SHEETS_FILE, sheets);
  res.status(201).json({ ok: true, sheet: newSheet });
});

// 2.b Delete a signup sheet
app.delete("/api/sheets/:id", async (req, res) => {
  const id = Number(req.params.id) || 0;
  const sheets = await readJSON(SHEETS_FILE, []);
  const idx = sheets.findIndex(s => Number(s.id) === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Sheet not found." });
  const [removed] = sheets.splice(idx, 1);
  await writeJSON(SHEETS_FILE, sheets);
  res.json({ ok: true, removed: { id: removed.id, assignment: removed.assignment } });
});

// 2.c List sheets for a course
app.get("/api/sheets", async (req, res) => {
  const { term, section = 1 } = req.query;
  if (!isIntInRange(term, 1, 9999) || !isIntInRange(section, 1, 99)) {
    return res.status(400).json({ ok: false, error: "term (1–9999) and section (1–99) are required integers." });
  }
  const sheets = await readJSON(SHEETS_FILE, []);
  const list = sheets.filter(s => s.term === Number(term) && s.section === Number(section));
  res.json({ ok: true, sheets: list });
});

// 2.d Add slots
app.post("/api/slots", async (req, res) => {
  const { ok, value, errors } = validateSlotsInput(req.body || {});
  if (!ok) return res.status(400).json({ ok: false, errors });

  const sheets = await readJSON(SHEETS_FILE, []);
  const sheet = findSheet(sheets, value.sheetId);
  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found." });

  let added = 0;
  const created = [];
  let startT = new Date(value.start).getTime();

  for (let i = 0; i < value.numSlots; i++) {
    const slot = {
      id: nextId(sheet.slots),
      start: new Date(startT).toISOString(),
      slotDuration: value.slotDuration,
      maxMembers: value.maxMembers,
      members: [] // memberId[]
    };
    sheet.slots.push(slot);
    created.push(slot);
    added++;
    startT += value.slotDuration * 60 * 1000;
  }

  await writeJSON(SHEETS_FILE, sheets);
  res.status(201).json({ ok: true, added, slots: created });
});

// 2.e List slots for a sheet
app.get("/api/slots", async (req, res) => {
  const sheetId = Number(req.query.sheetId) || 0;
  if (!sheetId) return res.status(400).json({ ok: false, error: "sheetId required" });
  const sheets = await readJSON(SHEETS_FILE, []);
  const sheet = findSheet(sheets, sheetId);
  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found." });
  res.json({ ok: true, slots: sheet.slots || [] });
});

// 2.f Modify a slot
app.patch("/api/slots/:id", async (req, res) => {
  const slotId = Number(req.params.id) || 0;
  const { ok, value, errors } = validateSlotPatch(req.body || {});
  if (!ok) return res.status(400).json({ ok: false, errors });

  const sheets = await readJSON(SHEETS_FILE, []);
  let slot, membersInSlot = [];
  for (const sh of sheets) {
    slot = (sh.slots || []).find(sl => Number(sl.id) === slotId);
    if (slot) { membersInSlot = slot.members || []; break; }
  }
  if (!slot) return res.status(404).json({ ok: false, error: "Slot not found." });

  Object.assign(slot, value);
  await writeJSON(SHEETS_FILE, sheets);
  res.json({ ok: true, members: membersInSlot });
});

// 2.g Sign up for a slot
app.post("/api/signups", async (req, res) => {
  const sheetId = Number(req.body?.sheetId) || 0;
  const slotId  = Number(req.body?.slotId)  || 0;
  const memberId = String(req.body?.memberId || "").trim();
  if (!sheetId || !slotId || !memberId) return res.status(400).json({ ok: false, error: "sheetId, slotId, memberId required." });

  const sheets = await readJSON(SHEETS_FILE, []);
  const sheet = findSheet(sheets, sheetId);
  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found." });
  const slot = (sheet.slots || []).find(s => Number(s.id) === slotId);
  if (!slot) return res.status(404).json({ ok: false, error: "Slot not found." });

  slot.members ||= [];
  if (slot.members.includes(memberId)) return res.status(409).json({ ok: false, error: "Member already signed up for this slot." });
  if (slot.members.length >= slot.maxMembers) return res.status(409).json({ ok: false, error: "Slot is full." });

  slot.members.push(memberId);
  await writeJSON(SHEETS_FILE, sheets);
  res.status(201).json({ ok: true, slotId, members: slot.members });
});

// 2.h Delete a sign-up
app.delete("/api/signups", async (req, res) => {
  const sheetId = Number(req.body?.sheetId) || 0;
  const memberId = String(req.body?.memberId || "").trim();
  if (!sheetId || !memberId) return res.status(400).json({ ok: false, error: "sheetId and memberId required." });

  const sheets = await readJSON(SHEETS_FILE, []);
  const sheet = findSheet(sheets, sheetId);
  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found." });

  let slotInfo = null;
  for (const s of sheet.slots || []) {
    const before = s.members?.length || 0;
    s.members = (s.members || []).filter(id => id !== memberId);
    if (s.members.length !== before) {
      slotInfo = { slotId: s.id, start: s.start };
      break;
    }
  }
  if (!slotInfo) return res.status(404).json({ ok: false, error: "Sign-up not found." });

  await writeJSON(SHEETS_FILE, sheets);
  res.json({ ok: true, slot: slotInfo });
});

// ---------- 3.a: Get members in a given slot ----------
app.get("/api/slots/:id/members", async (req, res) => {
  const slotId = Number(req.params.id);
  if (!Number.isInteger(slotId) || slotId <= 0) {
    return res.status(400).json({ ok: false, error: "slot id must be a positive integer" });
  }

  // Find slot in sheets.json
  const sheets = await readJSON(SHEETS_FILE, []);
  let foundSheet = null;
  let foundSlot  = null;
  for (const sh of sheets) {
    const sl = (sh.slots || []).find(s => Number(s.id) === slotId);
    if (sl) { foundSheet = sh; foundSlot = sl; break; }
  }
  if (!foundSlot) return res.status(404).json({ ok: false, error: "Slot not found." });

  // Map member IDs to member objects from the matching course
  const courses = await readJSON(COURSES_FILE, []);
  const course = courses.find(c => c.term === Number(foundSheet.term) && c.section === Number(foundSheet.section));
  const memIndex = new Map((course?.members || []).map(m => [String(m.id), m]));
  const members = (foundSlot.members || []).map(id => memIndex.get(String(id))).filter(Boolean);

  res.json({ ok: true, members });
});

// ---------- 3.b: Enter/modify a grade & append comment ----------
app.post("/api/grades", async (req, res) => {
  const { ok, value, errors } = validateGradeInput(req.body || {});
  if (!ok) return res.status(400).json({ ok: false, errors });

  // Store grades on the sheet in sheets.json
  const sheets = await readJSON(SHEETS_FILE, []);
  const sheet = sheets.find(s => Number(s.id) === Number(value.sheetId));
  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found." });

  sheet.grades ||= {}; // { memberId: { grade, comment } }
  const prev        = sheet.grades[value.memberId]?.grade ?? null;
  const prevComment = sheet.grades[value.memberId]?.comment ?? "";
  const concatenated = (prevComment ? prevComment + "\n" : "") + value.comment;

  sheet.grades[value.memberId] = { grade: value.grade, comment: concatenated.slice(0, 500) };
  await writeJSON(SHEETS_FILE, sheets);

  res.json({ ok: true, previous: prev, current: sheet.grades[value.memberId] });
});

// Root
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
