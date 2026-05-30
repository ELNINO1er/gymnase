import { Router } from "express";
import { getPlans, getUserPlans, getPlanDetail, createPlan, updatePlanStatus, deletePlan } from "../controllers/workouts.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);

router.get("/user/:userId", getUserPlans);
router.get("/:id", getPlanDetail);

// Coach + Admin
router.get("/", roleGuard("COACH", "ADMIN", "SUPER_ADMIN"), getPlans);
router.post("/", roleGuard("COACH", "ADMIN", "SUPER_ADMIN"), createPlan);
router.put("/:id/status", roleGuard("COACH", "ADMIN", "SUPER_ADMIN"), updatePlanStatus);
router.delete("/:id", roleGuard("ADMIN", "SUPER_ADMIN"), deletePlan);

export default router;
