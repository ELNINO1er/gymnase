import { Router } from "express";
import { exportMembers, exportPayments, exportReservations, exportAttendance } from "../controllers/exports.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/members", exportMembers);
router.get("/payments", exportPayments);
router.get("/reservations", exportReservations);
router.get("/attendance", exportAttendance);

export default router;
