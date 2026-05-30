import { Router } from "express";
import {
  getSubscriptions,
  getUserSubscriptions,
  createSubscription,
  activateSubscription,
  cancelSubscription,
  renewSubscription,
  getExpiredSubscriptions,
} from "../controllers/subscriptions.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Toutes les routes subscriptions necessitent une authentification
router.use(authGuard);

// Routes membre : voir ses propres abonnements
router.get("/user/:userId", getUserSubscriptions);

// Routes admin
router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), getSubscriptions);
router.get("/expired", roleGuard("ADMIN", "SUPER_ADMIN"), getExpiredSubscriptions);
router.post("/", roleGuard("ADMIN", "SUPER_ADMIN"), createSubscription);
router.put("/:id/activate", roleGuard("ADMIN", "SUPER_ADMIN"), activateSubscription);
router.put("/:id/cancel", roleGuard("ADMIN", "SUPER_ADMIN"), cancelSubscription);
router.put("/:id/renew", roleGuard("ADMIN", "SUPER_ADMIN"), renewSubscription);

export default router;
