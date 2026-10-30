import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../lib/current-user.js";
const router = Router();
router.use(requireAuth);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
export default router;
