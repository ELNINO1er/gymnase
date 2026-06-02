import { Router } from "express";
import { getInbox, getSent, sendMessage, markMessageRead, getUnreadCount } from "../controllers/messages.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);

// Membre + Admin
router.get("/inbox", getInbox);
router.get("/unread-count", getUnreadCount);
router.put("/:id/read", markMessageRead);

// Admin : historique d'envoi
router.get("/sent", roleGuard("ADMIN", "SUPER_ADMIN"), getSent);

// Membre + admin : envoyer/repondre.
// Le controleur limite les membres aux messages prives vers les admins de leur salle.
router.post("/send", sendMessage);

export default router;
