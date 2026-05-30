import { Router } from "express";
import { getPeakHours, getPopularSessions, getProfitableDays, getTopMembers, getRetention } from "../controllers/analytics.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/peak-hours", getPeakHours);
router.get("/popular-sessions", getPopularSessions);
router.get("/profitable-days", getProfitableDays);
router.get("/top-members", getTopMembers);
router.get("/retention", getRetention);

export default router;
