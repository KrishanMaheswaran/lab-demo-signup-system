import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readJSON(file, fallback) {
  try {
    await ensureDir();
    const full = path.join(dataDir, file);
    const buf = await fs.readFile(full);
    return JSON.parse(buf.toString());
  } catch {
    return fallback;
  }
}

export async function writeJSON(file, data) {
  await ensureDir();
  const full = path.join(dataDir, file);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf8");
}
