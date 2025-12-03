import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    getMySignups,
    getAvailableSlots,
    signupForSlot,
    leaveSlot
} from "../controllers/students.js";

const router = express.Router();

// All student routes require authentication
router.use(verifyToken);

// GET my signed up slots with grades
router.get("/my-signups", getMySignups);

// GET available slots to sign up for
router.get("/available-slots", getAvailableSlots);

// POST sign up for a slot
router.post("/signup/:slotId", signupForSlot);

// DELETE leave a slot
router.delete("/leave/:slotId", leaveSlot);

export default router;
