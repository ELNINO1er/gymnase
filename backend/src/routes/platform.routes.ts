import { Router } from "express";
import { authGuard, platformGuard } from "../middlewares/auth.js";
import { createGym, getPlatformSummary, listGyms, updateGymStatus } from "../controllers/platform.controller.js";

const router = Router();

router.use(authGuard, platformGuard);

router.get("/summary", getPlatformSummary);
router.get("/gyms", listGyms);
router.post("/gyms", createGym);
router.put("/gyms/:id/status", updateGymStatus);

export default router;
