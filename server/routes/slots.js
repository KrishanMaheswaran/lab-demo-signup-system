import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    listSlots,
    addSlot,
    updateSlot,
    deleteSlot
} from "../controllers/slots.js";

const router = express.Router();

// All slot routes require authentication (TA/admin only)
router.use(verifyToken);

// GET all slots for a signup sheet
router.get("/:sheetId", listSlots);

// POST create new slot
router.post("/:sheetId", addSlot);

// PUT update slot
router.put("/:slotId", updateSlot);

// DELETE slot
router.delete("/:slotId", deleteSlot);

export default router;
