import { Router } from "express";
import { getUserProgress, addProgress, deleteProgress } from "../controllers/progress.controller.js";
import { authGuard } from "../middlewares/auth.js";

const router = Router();
router.use(authGuard);

router.get("/user/:userId", getUserProgress);
router.post("/", addProgress);
router.delete("/:id", deleteProgress);

export default router;
