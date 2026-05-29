import { Router } from "express";
import { getMyReferralCode, useReferralCode, getAllReferrals, approveReferral } from "../controllers/referrals.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);

// Membre
router.get("/my-code", getMyReferralCode);
router.post("/use", useReferralCode);

// Admin
router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), getAllReferrals);
router.put("/:id/approve", roleGuard("ADMIN", "SUPER_ADMIN"), approveReferral);

export default router;
