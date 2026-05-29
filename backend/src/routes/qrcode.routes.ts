import { Router } from "express";
import { getMyQrCode, verifyQrCode, regenerateQrCode } from "../controllers/qrcode.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Membre : voir/regenerer son QR
router.get("/my", authGuard, getMyQrCode);
router.post("/regenerate", authGuard, regenerateQrCode);

// Admin/accueil : verifier un QR (check-in auto)
router.post("/verify", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), verifyQrCode);

export default router;
