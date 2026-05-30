import { Router } from "express";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../controllers/branches.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : liste des branches
router.get("/", getBranches);

// Admin
router.post("/", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), createBranch);
router.put("/:id", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), updateBranch);
router.delete("/:id", authGuard, roleGuard("ADMIN", "SUPER_ADMIN"), deleteBranch);

export default router;
