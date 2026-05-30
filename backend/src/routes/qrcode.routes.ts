import { Router } from "express";
import { getMyQrCode, verifyQrCode, scanQrCode, selfCheckIn, regenerateQrCode } from "../controllers/qrcode.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : scan depuis la borne kiosque
router.post("/scan", scanQrCode);

// Membre : voir/regenerer son QR + self check-in
router.get("/my", authGuard, getMyQrCode);
router.post("/regenerate", authGuard, regenerateQrCode);
router.post("/self-checkin", authGuard, selfCheckIn);

// Admin : verifier un QR
router.post("/verify", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), verifyQrCode);

export default router;
