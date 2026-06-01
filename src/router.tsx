import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { MemberLayout } from "./layouts/MemberLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Pages publiques
import { HomePage } from "./pages/public/HomePage";
import { PlansPage } from "./pages/public/PlansPage";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";

// Pages membre
import { MemberDashboard } from "./pages/member/MemberDashboard";
import { MemberReservations } from "./pages/member/MemberReservations";
import { MemberPayments } from "./pages/member/MemberPayments";
import { MemberProfile } from "./pages/member/MemberProfile";
import { MemberQrCode } from "./pages/member/MemberQrCode";
import { MemberProgress } from "./pages/member/MemberProgress";
import { MemberWorkouts } from "./pages/member/MemberWorkouts";
import { MemberBadges } from "./pages/member/MemberBadges";
import { MemberReferral } from "./pages/member/MemberReferral";
import { MemberMessages } from "./pages/member/MemberMessages";

// Pages admin
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminMembers } from "./pages/admin/AdminMembers";
import { AdminCRM } from "./pages/admin/AdminCRM";
import { AdminReservations } from "./pages/admin/AdminReservations";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminPresences } from "./pages/admin/AdminPresences";
import { AdminPromos } from "./pages/admin/AdminPromos";
import { AdminWorkouts } from "./pages/admin/AdminWorkouts";
import { AdminBoutique } from "./pages/admin/AdminBoutique";
import { AdminMessages } from "./pages/admin/AdminMessages";
import { AdminExports } from "./pages/admin/AdminExports";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminBranches } from "./pages/admin/AdminBranches";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminNotifications } from "./pages/admin/AdminNotifications";
import { AdminRiskScores } from "./pages/admin/AdminRiskScores";
import { AdminSubscriptions } from "./pages/admin/AdminSubscriptions";
import { AdminInvoices } from "./pages/admin/AdminInvoices";
import { AdminPlatform } from "./pages/admin/AdminPlatform";

export const router = createBrowserRouter([
  // ── Routes publiques ─────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/plans", element: <PlansPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/admin/login", element: <LoginPage adminOnly /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ── Routes membre ────────────────────────────────────────
  {
    element: (
      <ProtectedRoute roles={["MEMBER", "ADMIN", "SUPER_ADMIN"]}>
        <MemberLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/membre", element: <MemberDashboard /> },
      { path: "/membre/reservations", element: <MemberReservations /> },
      { path: "/membre/paiements", element: <MemberPayments /> },
      { path: "/membre/profil", element: <MemberProfile /> },
      { path: "/membre/qrcode", element: <MemberQrCode /> },
      { path: "/membre/progression", element: <MemberProgress /> },
      { path: "/membre/programmes", element: <MemberWorkouts /> },
      { path: "/membre/badges", element: <MemberBadges /> },
      { path: "/membre/parrainage", element: <MemberReferral /> },
      { path: "/membre/messages", element: <MemberMessages /> },
    ],
  },

  // ── Routes admin ─────────────────────────────────────────
  {
    element: (
      <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]} loginPath="/admin/login">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/membres", element: <AdminMembers /> },
      { path: "/admin/membres/:id/crm", element: <AdminCRM /> },
      { path: "/admin/reservations", element: <AdminReservations /> },
      { path: "/admin/paiements", element: <AdminPayments /> },
      { path: "/admin/plans", element: <AdminPlans /> },
      { path: "/admin/presences", element: <AdminPresences /> },
      { path: "/admin/promos", element: <AdminPromos /> },
      { path: "/admin/programmes", element: <AdminWorkouts /> },
      { path: "/admin/boutique", element: <AdminBoutique /> },
      { path: "/admin/messagerie", element: <AdminMessages /> },
      { path: "/admin/exports", element: <AdminExports /> },
      { path: "/admin/analytics", element: <AdminAnalytics /> },
      { path: "/admin/branches", element: <AdminBranches /> },
      { path: "/admin/logs", element: <AdminLogs /> },
      { path: "/admin/settings", element: <AdminSettings /> },
      { path: "/admin/notifications", element: <AdminNotifications /> },
      { path: "/admin/risques", element: <AdminRiskScores /> },
      { path: "/admin/abonnements", element: <AdminSubscriptions /> },
      { path: "/admin/factures", element: <AdminInvoices /> },
      { path: "/admin/plateforme", element: <AdminPlatform /> },
    ],
  },

  // ── Mode Kiosque ──────────────────────────────────────────
  {
    path: "/kiosk",
    lazy: async () => {
      const { KioskPage } = await import("./pages/kiosk/KioskPage");
      return { Component: KioskPage };
    },
  },

  // ── Check-in (page ouverte apres scan du QR kiosque) ─────
  {
    path: "/checkin",
    lazy: async () => {
      const { CheckInPage } = await import("./pages/kiosk/CheckInPage");
      return { Component: CheckInPage };
    },
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);
