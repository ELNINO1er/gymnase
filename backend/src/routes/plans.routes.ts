import { Router } from "express";
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan } from "../controllers/plans.controller.js";
import { authGuard, optionalAuthGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : consulter les plans actifs
router.get("/", optionalAuthGuard, getPlans);
router.get("/:id", optionalAuthGuard, getPlanById);

// Admin : gerer les plans
router.post("/", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), createPlan);
router.put("/:id", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), updatePlan);
router.delete("/:id", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), deletePlan);

export default router;
