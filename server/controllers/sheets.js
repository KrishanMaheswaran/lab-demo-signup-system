// server/controllers/sheets.js
import { loadDB, saveDB } from "../models/db.js";

// LIST all sheets for a course
export async function listSheets(req, res) {
  const courseId = Number(req.params.courseId);
  const db = await loadDB();

  const sheets = db.sheets.filter(s => s.courseId === courseId);
  res.json({ ok: true, sheets });
}

// CREATE a sheet
export async function addSheet(req, res) {
  console.log("!!! ENTERING addSheet !!! Body:", JSON.stringify(req.body));
  const courseId = Number(req.params.courseId);
  const { assignmentName, description } = req.body || {};

  if (!assignmentName) {
    return res.status(400).json({ ok: false, error: "assignmentName required" });
  }

  const db = await loadDB();

  // prevent duplicates
  const exists = db.sheets.some(
    s => s.courseId === courseId && s.assignmentName.toLowerCase() === assignmentName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ ok: false, error: "Sheet already exists" });
  }

  const newSheet = {
    id: Date.now(),
    courseId,
    assignmentName,
    description: description || ""
  };

  db.sheets.push(newSheet);
  await saveDB(db);

  res.json({ ok: true, sheet: newSheet });
}

// UPDATE a sheet
export async function updateSheet(req, res) {
  const sheetId = Number(req.params.sheetId);
  const { assignmentName, description } = req.body || {};

  const db = await loadDB();
  const sheet = db.sheets.find(s => s.id === sheetId);

  if (!sheet) return res.status(404).json({ ok: false, error: "Sheet not found" });

  // only name & description allowed
  if (assignmentName) sheet.assignmentName = assignmentName;
  if (description) sheet.description = description;

  await saveDB(db);
  res.json({ ok: true, sheet });
}

// DELETE a sheet (MUST FAIL if slots exist)
export async function deleteSheet(req, res) {
  const sheetId = Number(req.params.sheetId);
  const db = await loadDB();

  // check slots
  const hasSlots = db.slots.some(slot => slot.sheetId === sheetId);
  if (hasSlots) {
    return res.status(400).json({
      ok: false,
      error: "Cannot delete sheet with existing slots"
    });
  }

  const before = db.sheets.length;
  db.sheets = db.sheets.filter(s => s.id !== sheetId);

  if (db.sheets.length === before) {
    return res.status(404).json({ ok: false, error: "Sheet not found" });
  }

  await saveDB(db);
  res.json({ ok: true });
}
