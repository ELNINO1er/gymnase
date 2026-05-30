import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
} from "../controllers/notifications.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);

// Membre et admin : ses notifications
router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

// Admin : envoyer notification
router.post("/", roleGuard("ADMIN", "SUPER_ADMIN"), createNotification);

export default router;
