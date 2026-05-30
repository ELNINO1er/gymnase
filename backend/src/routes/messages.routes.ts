import { Router } from "express";
import { getInbox, getSent, sendMessage, markMessageRead, getUnreadCount } from "../controllers/messages.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);

// Membre + Admin
router.get("/inbox", getInbox);
router.get("/unread-count", getUnreadCount);
router.put("/:id/read", markMessageRead);

// Admin
router.get("/sent", roleGuard("ADMIN", "SUPER_ADMIN"), getSent);
router.post("/send", roleGuard("ADMIN", "SUPER_ADMIN"), sendMessage);

export default router;
