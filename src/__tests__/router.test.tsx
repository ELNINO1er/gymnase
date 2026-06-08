import { describe, it, expect } from "vitest";
import { router } from "../router";

describe("Router configuration", () => {
  it("has public routes", () => {
    const publicRoutes = router.routes[0];
    expect(publicRoutes.children).toBeDefined();

    const paths = publicRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/plans");
    expect(paths).toContain("/login");
    expect(paths).toContain("/register");
  });

  it("has gym-scoped public routes", () => {
    const gymPublicRoutes = router.routes[1];
    expect(gymPublicRoutes.children).toBeDefined();

    const paths = gymPublicRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/g/:slug/login");
    expect(paths).toContain("/g/:slug/register");
    expect(paths).toContain("/g/:slug/admin/login");
  });

  it("has member routes with invoices", () => {
    const memberRoutes = router.routes[2];
    expect(memberRoutes.children).toBeDefined();

    const paths = memberRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/membre");
    expect(paths).toContain("/membre/reservations");
    expect(paths).toContain("/membre/paiements");
    expect(paths).toContain("/membre/profil");
    expect(paths).toContain("/membre/qrcode");
    expect(paths).toContain("/membre/progression");
    expect(paths).toContain("/membre/programmes");
    expect(paths).toContain("/membre/badges");
    expect(paths).toContain("/membre/boutique");
    expect(paths).toContain("/membre/parrainage");
    expect(paths).toContain("/membre/messages");
    expect(paths).toContain("/membre/factures");
  });

  it("has coach routes", () => {
    const coachRoutes = router.routes[3];
    expect(coachRoutes.children).toBeDefined();

    const paths = coachRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/coach");
    expect(paths).toContain("/coach/seances");
    expect(paths).toContain("/coach/membres");
    expect(paths).toContain("/coach/programmes");
  });

  it("has admin routes with slug", () => {
    const adminRoutes = router.routes[4];
    expect(adminRoutes.children).toBeDefined();

    const paths = adminRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/g/:slug/admin");
    expect(paths).toContain("/g/:slug/admin/membres");
    expect(paths).toContain("/g/:slug/admin/reservations");
    expect(paths).toContain("/g/:slug/admin/paiements");
    expect(paths).toContain("/g/:slug/admin/plans");
    expect(paths).toContain("/g/:slug/admin/presences");
    expect(paths).toContain("/g/:slug/admin/analytics");
    expect(paths).toContain("/g/:slug/admin/settings");
    expect(paths).toContain("/g/:slug/admin/factures");
    expect(paths).toContain("/g/:slug/admin/abonnements");
    expect(paths).toContain("/g/:slug/admin/boutique");
    expect(paths).toContain("/g/:slug/admin/risques");
  });

  it("has platform routes", () => {
    const platformRoutes = router.routes[5];
    expect(platformRoutes.children).toBeDefined();

    const paths = platformRoutes.children!.map((r) => r.path);
    expect(paths).toContain("/plateforme");
    expect(paths).toContain("/plateforme/salles");
    expect(paths).toContain("/plateforme/salles/:slugOrId");
    expect(paths).toContain("/plateforme/admins");
    expect(paths).toContain("/plateforme/logs");
  });

  it("has kiosk route with lazy loading", () => {
    const kioskRoute = router.routes.find((r) => r.path === "/kiosk");
    expect(kioskRoute).toBeDefined();
    expect(kioskRoute!.lazy).toBeDefined();
  });

  it("has checkin route with lazy loading", () => {
    const checkinRoute = router.routes.find((r) => r.path === "/checkin");
    expect(checkinRoute).toBeDefined();
    expect(checkinRoute!.lazy).toBeDefined();
  });

  it("has fallback route redirecting to /", () => {
    const fallback = router.routes.find((r) => r.path === "*");
    expect(fallback).toBeDefined();
  });
});
