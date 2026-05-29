import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import plansRoutes from "./plans.routes.js";
import subscriptionsRoutes from "./subscriptions.routes.js";
import reservationsRoutes from "./reservations.routes.js";
import paymentsRoutes from "./payments.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import notificationsRoutes from "./notifications.routes.js";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/plans", plansRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
