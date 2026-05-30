import { Router } from "express";
import { getPromos, createPromo, applyPromo, updatePromo, deletePromo } from "../controllers/promos.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : appliquer un code
router.post("/apply", applyPromo);

// Admin
router.use(authGuard);
router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), getPromos);
router.post("/", roleGuard("ADMIN", "SUPER_ADMIN"), createPromo);
router.put("/:id", roleGuard("ADMIN", "SUPER_ADMIN"), updatePromo);
router.delete("/:id", roleGuard("ADMIN", "SUPER_ADMIN"), deletePromo);

export default router;
