import { Router } from "express";
import { getSetupStatus } from "../controllers/system.controller.js";
const router = Router();
router.get("/setup", getSetupStatus);
export default router;
