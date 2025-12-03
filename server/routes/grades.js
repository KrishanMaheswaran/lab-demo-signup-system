import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    getCurrentSlot,
    addOrUpdateGrade,
    getAuditHistory,
    getAdjacentSlot
} from "../controllers/grades.js";

const router = express.Router();

// All grading routes require authentication (TA/admin only)
router.use(verifyToken);

// GET current slot for grading mode
router.get("/current/:sheetId", getCurrentSlot);

// GET adjacent slot (prev/next)
router.get("/navigate/:slotId", getAdjacentSlot);

// POST/PUT add or update grade
router.post("/:slotId/:memberId", addOrUpdateGrade);

// GET audit history for a grade
router.get("/audit/:gradeId", getAuditHistory);

export default router;
