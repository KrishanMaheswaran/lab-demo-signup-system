import { loadDB, saveDB } from "../models/db.js";

// Utility to generate incremental IDs
function nextId(collection) {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map(x => x.id)) + 1;
}

/* ---------------------------------------------------------
   LIST COURSES
---------------------------------------------------------- */
export async function listCourses(req, res) {
  const db = await loadDB();
  res.json({ ok: true, courses: db.courses });
}

/* ---------------------------------------------------------
   CREATE COURSE
---------------------------------------------------------- */
export async function createCourse(req, res) {
  const { term, code, section, name } = req.body || {};

  if (!term || !code || !section || !name) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  const db = await loadDB();

  const exists = db.courses.find(
    c => c.term === term && c.code === code && c.section === section
  );

  if (exists) {
    return res.status(400).json({ ok: false, error: "Course already exists" });
  }

  const newCourse = {
    id: nextId(db.courses),
    term,
    code,
    section,
    name
  };

  db.courses.push(newCourse);
  await saveDB(db);

  res.json({ ok: true, course: newCourse });
}

/* ---------------------------------------------------------
   UPDATE COURSE
---------------------------------------------------------- */
export async function updateCourse(req, res) {
  const courseId = Number(req.params.id);
  const { term, code, section, name } = req.body || {};

  const db = await loadDB();
  const course = db.courses.find(c => c.id === courseId);

  if (!course) {
    return res.status(404).json({ ok: false, error: "Course not found" });
  }

  // Check if course has signup sheets (3.b.iii)
  const hasSheets = db.sheets.some(s => s.courseId === courseId);

  // If course has sheets, only allow name changes
  if (hasSheets) {
    if (term !== undefined && term !== course.term) {
      return res.status(400).json({
        ok: false,
        error: "Cannot modify term - course has signup sheets. Only name is editable."
      });
    }
    if (code !== undefined && code !== course.code) {
      return res.status(400).json({
        ok: false,
        error: "Cannot modify code - course has signup sheets. Only name is editable."
      });
    }
    if (section !== undefined && section !== course.section) {
      return res.status(400).json({
        ok: false,
        error: "Cannot modify section - course has signup sheets. Only name is editable."
      });
    }

    // Only update name
    if (name) course.name = name;
    await saveDB(db);
    return res.json({ ok: true, course });
  }

  // No sheets - validate uniqueness for full updates
  const conflict = db.courses.find(
    c =>
      c.id !== courseId &&
      c.term === (term || course.term) &&
      c.code === (code || course.code) &&
      c.section === (section || course.section)
  );

  if (conflict) {
    return res.status(400).json({ ok: false, error: "Course already exists" });
  }

  // Update all fields
  if (term) course.term = term;
  if (code) course.code = code;
  if (section) course.section = section;
  if (name) course.name = name;

  await saveDB(db);

  res.json({ ok: true, course });
}

/* ---------------------------------------------------------
   DELETE COURSE
---------------------------------------------------------- */
export async function deleteCourse(req, res) {
  const courseId = Number(req.params.id);

  const db = await loadDB();

  // Check if sign-up sheets exist (lab requirement)
  const hasSheet = db.sheets.some(s => s.courseId === courseId);
  if (hasSheet) {
    return res.status(400).json({
      ok: false,
      error: "Cannot delete course with existing signup sheets"
    });
  }

  const newList = db.courses.filter(c => c.id !== courseId);

  if (newList.length === db.courses.length) {
    return res.status(404).json({ ok: false, error: "Course not found" });
  }

  db.courses = newList;
  await saveDB(db);

  res.json({ ok: true, deletedId: courseId });
}
