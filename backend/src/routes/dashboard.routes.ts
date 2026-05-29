import { Router } from "express";
import {
  getSummary,
  getDailyRevenue,
  getMonthlyRevenue,
  getTodayDashboard,
  getMembersStats,
} from "../controllers/dashboard.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/summary", getSummary);
router.get("/revenue/daily", getDailyRevenue);
router.get("/revenue/monthly", getMonthlyRevenue);
router.get("/reservations/today", getTodayDashboard);
router.get("/members/stats", getMembersStats);

export default router;
