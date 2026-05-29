import { Router } from "express";
import {
  getPayments,
  getUserPayments,
  createPayment,
  validatePayment,
  cancelPayment,
  refundPayment,
  getDailyStats,
  getMonthlyStats,
} from "../controllers/payments.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);

// Membre : voir ses paiements
router.get("/user/:userId", getUserPayments);

// Admin
router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), getPayments);
router.post("/", roleGuard("ADMIN", "SUPER_ADMIN"), createPayment);
router.put("/:id/validate", roleGuard("ADMIN", "SUPER_ADMIN"), validatePayment);
router.put("/:id/cancel", roleGuard("ADMIN", "SUPER_ADMIN"), cancelPayment);
router.put("/:id/refund", roleGuard("ADMIN", "SUPER_ADMIN"), refundPayment);
router.get("/stats/daily", roleGuard("ADMIN", "SUPER_ADMIN"), getDailyStats);
router.get("/stats/monthly", roleGuard("ADMIN", "SUPER_ADMIN"), getMonthlyStats);

export default router;
