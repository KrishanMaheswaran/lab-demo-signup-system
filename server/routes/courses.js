import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse
} from "../controllers/courses.js";

const router = express.Router();

// All course routes require TA login
router.use(verifyToken);

// List all courses
router.get("/", listCourses);

// Create a new course
router.post("/", createCourse);

// Update an existing course
router.put("/:id", updateCourse);

// Delete a course
router.delete("/:id", deleteCourse);

export default router;
