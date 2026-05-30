import { Router } from "express";
import {
  getReservations,
  getTodayReservations,
  getUserReservations,
  createReservation,
  cancelReservation,
  completeReservation,
  noShowReservation,
  getAvailableSlots,
  getSessions,
} from "../controllers/reservations.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : voir les types de seances
router.get("/sessions", getSessions);

// Authentifie : creneaux disponibles
router.get("/available-slots", authGuard, getAvailableSlots);

// Membre : ses reservations + creer/annuler
router.get("/user/:userId", authGuard, getUserReservations);
router.post("/", authGuard, createReservation);
router.put("/:id/cancel", authGuard, cancelReservation);

// Admin : toutes les reservations + actions
router.get("/", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), getReservations);
router.get("/today", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), getTodayReservations);
router.put("/:id/complete", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), completeReservation);
router.put("/:id/no-show", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), noShowReservation);

export default router;
