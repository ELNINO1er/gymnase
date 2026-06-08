import { Router } from "express";
import { authGuard, platformGuard } from "../middlewares/auth.js";
import {
  createGym,
  createGymAdmin,
  createPlatformAdmin,
  getGymDetail,
  getPlatformLogs,
  getPlatformRevenue,
  getPlatformSummary,
  leaveGym,
  listGyms,
  listPlatformAdmins,
  switchGym,
  updateGymStatus,
} from "../controllers/platform.controller.js";

const router = Router();

router.use(authGuard, platformGuard);

router.get("/summary", getPlatformSummary);
router.get("/gyms", listGyms);
router.post("/gyms", createGym);
router.get("/gyms/:slugOrId", getGymDetail);
router.put("/gyms/:id/status", updateGymStatus);
router.post("/gyms/:id/admins", createGymAdmin);
router.get("/revenue", getPlatformRevenue);
router.get("/logs", getPlatformLogs);
router.post("/switch-gym", switchGym);
router.post("/leave-gym", leaveGym);
router.get("/admins", listPlatformAdmins);
router.post("/admins", createPlatformAdmin);

export default router;
