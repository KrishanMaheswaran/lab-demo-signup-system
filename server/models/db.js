import { readJSON, writeJSON } from "../storage.js";
import { defaultDB } from "./schema.js";

const DB_FILE = "db.json";

export async function loadDB() {
  const db = await readJSON(DB_FILE, defaultDB);
  return db;
}

export async function saveDB(db) {
  await writeJSON(DB_FILE, db);
}
