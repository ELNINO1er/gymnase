import { Router } from "express";
import { generateInvoice, getInvoicePdf, getInvoices, getUserInvoices } from "../controllers/invoices.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

router.use(authGuard);

// Membre : ses factures
router.get("/user/:userId", getUserInvoices);

// Admin
router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), getInvoices);
router.post("/generate", roleGuard("ADMIN", "SUPER_ADMIN"), generateInvoice);
router.get("/:id/pdf", getInvoicePdf);

export default router;
