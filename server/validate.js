export function isIntInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

export function sanitizeText(str, maxLen) {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLen).trim();
}

export function validateCourse(input) {
  const term = Number(input.term);
  const section = input.section === undefined ? 1 : Number(input.section);
  const name = sanitizeText(input.name, 100);

  const errors = [];
  if (!isIntInRange(term, 1, 9999)) errors.push("term must be an integer 1–9999");
  if (!isIntInRange(section, 1, 99)) errors.push("section must be an integer 1–99");
  if (!name) errors.push("name is required (max 100 chars)");

  return {
    ok: errors.length === 0,
    value: { term, section, name },
    errors
  };
}
export function validateStudent(input) {
  const id = (typeof input.id === "string" ? input.id : "").slice(0, 20).trim();
  const name = (typeof input.name === "string" ? input.name : "").slice(0, 100).trim();
  const email = (typeof input.email === "string" ? input.email : "").slice(0, 120).trim();

  const errors = [];
  if (!id) errors.push("id is required");
  if (!name) errors.push("name is required");
  if (!email || !email.includes("@")) errors.push("valid email is required");

  return { ok: errors.length === 0, value: { id, name, email }, errors };
}
export function sanitizeFixed(str, maxLen) {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLen).trim();
}

export function validateMember(m) {
  const id = sanitizeFixed(m.id ?? m.memberId ?? "", 8);
  const first = sanitizeFixed(m.first ?? m.firstName ?? "", 200);
  const last  = sanitizeFixed(m.last ?? m.lastName ?? "", 200);
  const role  = sanitizeFixed(m.role ?? "", 10);

  const errors = [];
  if (id.length !== 8) errors.push("member id must be exactly 8 chars");
  if (!first) errors.push("first name is required (<=200 chars)");
  if (!last) errors.push("last name is required (<=200 chars)");
  if (!role) errors.push("role is required (<=10 chars)");

  return { ok: errors.length === 0, value: { id, first, last, role }, errors };
}
export function toIntInRange(x, min, max, def = 0) {
  const n = Number(x);
  return Number.isInteger(n) && n >= min && n <= max ? n : def;
}
export function isIsoTime(s) {
  // accept either ms/number or ISO string parsable by Date
  const d = new Date(s);
  return !isNaN(d.getTime());
}
export function toIso(s) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : new Date(d.getTime()).toISOString();
}

// 2.a: sheet input
export function validateSheetInput(input) {
  const term = toIntInRange(input.term, 1, 9999, 0);
  const section = input.section === undefined ? 1 : toIntInRange(input.section, 1, 99, 0);
  const assignment = (typeof input.assignment === "string" ? input.assignment : "").slice(0, 100).trim();
  const notBefore = toIso(input.notBefore);
  const notAfter  = toIso(input.notAfter);

  const errors = [];
  if (!term) errors.push("term must be an integer 1–9999");
  if (!section) errors.push("section must be an integer 1–99");
  if (!assignment) errors.push("assignment is required (max 100 chars)");
  if (!isIsoTime(notBefore)) errors.push("notBefore must be a valid timestamp");
  if (!isIsoTime(notAfter)) errors.push("notAfter must be a valid timestamp");
  if (isIsoTime(notBefore) && isIsoTime(notAfter) && new Date(notBefore) > new Date(notAfter)) {
    errors.push("notBefore must be <= notAfter");
  }
  return { ok: errors.length === 0, value: { term, section, assignment, notBefore, notAfter }, errors };
}

// 2.d: add slots input
export function validateSlotsInput(input) {
  const sheetId = Number(input.sheetId) || 0;
  const start = toIso(input.start);
  const slotDuration = toIntInRange(input.slotDuration, 1, 240, 0);
  const numSlots = toIntInRange(input.numSlots, 1, 99, 0);
  const maxMembers = toIntInRange(input.maxMembers, 1, 99, 0);

  const errors = [];
  if (!sheetId) errors.push("sheetId is required (number)");
  if (!isIsoTime(start)) errors.push("start must be a valid timestamp");
  if (!slotDuration) errors.push("slotDuration must be 1–240");
  if (!numSlots) errors.push("numSlots must be 1–99");
  if (!maxMembers) errors.push("maxMembers must be 1–99");

  return { ok: errors.length === 0, value: { sheetId, start, slotDuration, numSlots, maxMembers }, errors };
}

// 2.f: patch slot input (all optional but validated if present)
export function validateSlotPatch(input) {
  const out = {};
  const errors = [];
  if ("start" in input) {
    if (!isIsoTime(input.start)) errors.push("start must be a valid timestamp");
    else out.start = toIso(input.start);
  }
  if ("slotDuration" in input) {
    const v = toIntInRange(input.slotDuration, 1, 240, 0);
    if (!v) errors.push("slotDuration must be 1–240");
    else out.slotDuration = v;
  }
  if ("maxMembers" in input) {
    const v = toIntInRange(input.maxMembers, 1, 99, 0);
    if (!v) errors.push("maxMembers must be 1–99");
    else out.maxMembers = v;
  }
  return { ok: errors.length === 0, value: out, errors };
}
export function validateGradeInput(input) {
  const sheetId = Number(input.sheetId) || 0;
  const memberId = String(input.memberId ?? "").slice(0, 8).trim();
  const grade = Number(input.grade);
  const comment = String(input.comment ?? "").slice(0, 500).trim();

  const errors = [];
  if (!Number.isInteger(sheetId) || sheetId <= 0) errors.push("sheetId must be a positive integer");
  if (memberId.length !== 8) errors.push("memberId must be exactly 8 chars");
  if (!Number.isInteger(grade) || grade < 0 || grade > 999) errors.push("grade must be an integer 0–999");

  return { ok: errors.length === 0, value: { sheetId, memberId, grade, comment }, errors };
}
