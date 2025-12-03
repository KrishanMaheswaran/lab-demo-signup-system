// server/controllers/members.js
import { loadDB, saveDB } from "../models/db.js";

// list members of a course
export async function listMembers(req, res) {
  const courseId = Number(req.params.courseId);
  const db = await loadDB();

  const members = db.members.filter(m => m.courseId === courseId);
  res.json({ ok: true, members });
}

// add one member
export async function addMember(req, res) {
  const courseId = Number(req.params.courseId);
  const { username, firstName, lastName, password } = req.body || {};

  if (!username || !firstName || !lastName || !password)
    return res.status(400).json({ ok: false, error: "Missing fields" });

  const db = await loadDB();

  const exists = db.members.some(
    m => m.courseId === courseId && m.username === username
  );
  if (exists) return res.status(400).json({ ok: false, error: "Member already exists" });

  const newMember = {
    id: Date.now(),
    courseId,
    username,
    firstName,
    lastName,
    password
  };

  db.members.push(newMember);
  await saveDB(db);

  res.json({ ok: true, member: newMember });
}

// delete member
export async function deleteMember(req, res) {
  const courseId = Number(req.params.courseId);
  const memberId = Number(req.params.memberId);

  const db = await loadDB();

  // check if has signup
  const hasSignup = db.slots.some(slot =>
    slot.signupMemberIds.includes(memberId)
  );
  if (hasSignup)
    return res.status(400).json({
      ok: false,
      error: "Cannot delete member with active signup"
    });

  const before = db.members.length;
  db.members = db.members.filter(
    m => !(m.courseId === courseId && m.id === memberId)
  );

  if (db.members.length === before)
    return res.status(404).json({ ok: false, error: "Member not found" });

  await saveDB(db);
  res.json({ ok: true });
}

// bulk add members via CSV
export async function bulkAddMembers(req, res) {
  const courseId = Number(req.params.courseId);
  const file = req.file;

  if (!file) return res.status(400).json({ ok: false, error: "CSV file required" });

  const text = file.buffer.toString("utf-8").trim();
  const lines = text.split("\n");

  const db = await loadDB();
  let added = [];

  for (const line of lines) {
    const [last, first, username, password] = line.split(",").map(s => s.trim());
    if (!username || !password) continue;

    const exists = db.members.some(
      m => m.courseId === courseId && m.username === username
    );
    if (exists) continue;

    const member = {
      id: Date.now() + Math.floor(Math.random() * 999),
      courseId,
      username,
      firstName: first,
      lastName: last,
      password
    };
    db.members.push(member);
    added.push(member);
  }

  await saveDB(db);

  res.json({ ok: true, added });
}
