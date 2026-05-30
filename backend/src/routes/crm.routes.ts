import { Router } from "express";
import { getMemberCRM, addMemberNote, deleteMemberNote, getAllRiskScores, recalculateRiskScores } from "../controllers/crm.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.get("/member/:id", getMemberCRM);
router.post("/member/:id/note", addMemberNote);
router.delete("/note/:id", deleteMemberNote);
router.get("/risk-scores", getAllRiskScores);
router.post("/risk-scores/recalculate", recalculateRiskScores);

export default router;
