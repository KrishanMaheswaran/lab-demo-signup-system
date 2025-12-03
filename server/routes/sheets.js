import express from "express";
import { verifyToken } from "../middleware/auth.js";

import {
  listSheets,
  addSheet,
  updateSheet,
  deleteSheet
} from "../controllers/sheets.js";

const router = express.Router();

// all require auth (TA or admin)
router.use(verifyToken);

// GET all sheets for a course
router.get("/:courseId", listSheets);

// POST create sheet
router.post("/:courseId", addSheet);

// PUT update a sheet
router.put("/one/:sheetId", updateSheet);

// DELETE delete a sheet
router.delete("/one/:sheetId", deleteSheet);

export default router;
