import { Router } from "express";
import { authGuard, roleGuard } from "../middlewares/auth.js";
import { getCoachDashboard, getCoachSessions, getCoachMembers } from "../controllers/coach.controller.js";

const router = Router();

router.use(authGuard, roleGuard("COACH", "ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getCoachDashboard);
router.get("/sessions", getCoachSessions);
router.get("/members", getCoachMembers);

export default router;
