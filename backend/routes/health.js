import { Router } from "express";
import { getHealth } from "../controllers/system.controller.js";
const router = Router();
router.get("/healthz", getHealth);
export default router;
