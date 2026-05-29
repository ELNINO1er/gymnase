import { Router } from "express";
import { getAllBadges, getUserBadges, checkAndAwardBadges, awardBadge } from "../controllers/badges.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", getAllBadges);

// Auth
router.use(authGuard);
router.get("/user/:userId", getUserBadges);
router.post("/check/:userId", checkAndAwardBadges);

// Admin
router.post("/award", roleGuard("ADMIN", "SUPER_ADMIN"), awardBadge);

export default router;
