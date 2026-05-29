import { Router } from "express";
import { getLogs } from "../controllers/activityLogs.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/", getLogs);

export default router;
