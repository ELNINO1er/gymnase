import { Router } from "express";
import { getPublicSettings, getAllSettingsAdmin, updateSettings } from "../controllers/settings.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", getPublicSettings);

// Admin
router.get("/all", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), getAllSettingsAdmin);
router.put("/", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), updateSettings);

export default router;
