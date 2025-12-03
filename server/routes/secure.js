import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/me", (req, res) => {
  res.json({ ok: true, user: req.user });
});

export default router;
