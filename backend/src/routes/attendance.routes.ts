import { Router } from "express";
import { getInGym, manualCheckIn, checkOut, getTodayAttendance, getAttendanceHistory, getAttendanceStats } from "../controllers/attendance.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/in-gym", getInGym);
router.post("/check-in", manualCheckIn);
router.post("/check-out", checkOut);
router.get("/today", getTodayAttendance);
router.get("/history", getAttendanceHistory);
router.get("/stats", getAttendanceStats);

export default router;
