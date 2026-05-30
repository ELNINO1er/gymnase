import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  changePassword,
  updateProfile,
  refreshToken,
} from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/auth.js";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/me", authGuard, me);
router.post("/logout", authGuard, logout);
router.put("/password", authGuard, changePassword);
router.put("/profile", authGuard, updateProfile);
router.post("/refresh", authGuard, refreshToken);

export default router;
