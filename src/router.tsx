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

// Pages admin
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminMembers } from "./pages/admin/AdminMembers";
import { AdminReservations } from "./pages/admin/AdminReservations";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminNotifications } from "./pages/admin/AdminNotifications";

export const router = createBrowserRouter([
  // ── Routes publiques ─────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/plans", element: <PlansPage /> },
      { path: "/login", element: <LoginPage /> },
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
    ],
  },

  // ── Routes admin ─────────────────────────────────────────
  {
    element: (
      <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/membres", element: <AdminMembers /> },
      { path: "/admin/reservations", element: <AdminReservations /> },
      { path: "/admin/paiements", element: <AdminPayments /> },
      { path: "/admin/plans", element: <AdminPlans /> },
      { path: "/admin/notifications", element: <AdminNotifications /> },
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

  // ── Fallback ─────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);
