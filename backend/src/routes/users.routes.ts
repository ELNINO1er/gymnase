import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  validateUser,
  suspendUser,
  reactivateUser,
  searchUsers,
  getUserStats,
} from "../controllers/users.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Toutes les routes users necessitent d'etre authentifie + admin
router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

// Stats et recherche (avant /:id pour eviter conflit)
router.get("/stats", getUserStats);
router.get("/search", searchUsers);

// CRUD
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Actions admin
router.put("/:id/validate", validateUser);
router.put("/:id/suspend", suspendUser);
router.put("/:id/reactivate", reactivateUser);

export default router;
