import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

// Main token check
export function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ ok: false, error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(parts[1], TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

// Alias because your server imports verifyToken
export const verifyToken = auth;

// For admin-only endpoints
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin only" });
  }
  next();
}
