import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import plansRoutes from "./plans.routes.js";
import subscriptionsRoutes from "./subscriptions.routes.js";
import reservationsRoutes from "./reservations.routes.js";
import paymentsRoutes from "./payments.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import settingsRoutes from "./settings.routes.js";
import logsRoutes from "./logs.routes.js";
import qrcodeRoutes from "./qrcode.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import invoicesRoutes from "./invoices.routes.js";
import progressRoutes from "./progress.routes.js";
import workoutsRoutes from "./workouts.routes.js";
import promosRoutes from "./promos.routes.js";
import referralsRoutes from "./referrals.routes.js";
import exportsRoutes from "./exports.routes.js";
import crmRoutes from "./crm.routes.js";
import messagesRoutes from "./messages.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import branchesRoutes from "./branches.routes.js";
import shopRoutes from "./shop.routes.js";
import badgesRoutes from "./badges.routes.js";
import platformRoutes from "./platform.routes.js";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
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
router.use("/settings", settingsRoutes);
router.use("/logs", logsRoutes);
router.use("/qrcode", qrcodeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/invoices", invoicesRoutes);
router.use("/progress", progressRoutes);
router.use("/workouts", workoutsRoutes);
router.use("/promos", promosRoutes);
router.use("/referrals", referralsRoutes);
router.use("/exports", exportsRoutes);
router.use("/crm", crmRoutes);
router.use("/messages", messagesRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/branches", branchesRoutes);
router.use("/shop", shopRoutes);
router.use("/badges", badgesRoutes);
router.use("/platform", platformRoutes);

export default router;
