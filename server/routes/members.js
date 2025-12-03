import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";

import {
  listMembers,
  addMember,
  deleteMember,
  bulkAddMembers
} from "../controllers/members.js";

const router = express.Router();

// Multer config (MUST BE memoryStorage for CSV upload)
const upload = multer({ storage: multer.memoryStorage() });

// All member routes require login
router.use(verifyToken);

// GET all members in a course
router.get("/:courseId", listMembers);

// Add single member
router.post("/:courseId", addMember);

// Delete member
router.delete("/:courseId/:memberId", deleteMember);

// Bulk add CSV
router.post("/:courseId/bulk", upload.single("file"), bulkAddMembers);

export default router;
