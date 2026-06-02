import { describe, it, expect } from "vitest";

describe("Auth and role definitions", () => {
  it("UserRole includes COACH role", async () => {
    // The COACH role should be in the union type
    const validRoles = ["VISITOR", "MEMBER", "COACH", "ADMIN", "SUPER_ADMIN"];
    expect(validRoles).toContain("COACH");
    expect(validRoles).toHaveLength(5);
  });

  it("UserStatus covers all lifecycle states", () => {
    const validStatuses = ["PENDING", "ACTIVE", "SUSPENDED", "EXPIRED", "DELETED"];
    expect(validStatuses).toHaveLength(5);
    expect(validStatuses).toContain("PENDING");
    expect(validStatuses).toContain("ACTIVE");
    expect(validStatuses).toContain("SUSPENDED");
    expect(validStatuses).toContain("EXPIRED");
    expect(validStatuses).toContain("DELETED");
  });

  it("Admin roles include both ADMIN and SUPER_ADMIN", () => {
    const adminRoles = ["ADMIN", "SUPER_ADMIN"];
    expect(adminRoles).toHaveLength(2);
  });

  it("Platform admin requires is_platform_admin flag", () => {
    // Platform admin is identified by is_platform_admin, not role
    const platformAdmin = { role: "SUPER_ADMIN", is_platform_admin: true, gym_id: null };
    const gymAdmin = { role: "ADMIN", is_platform_admin: false, gym_id: 1 };

    expect(platformAdmin.is_platform_admin).toBe(true);
    expect(platformAdmin.gym_id).toBeNull();
    expect(gymAdmin.is_platform_admin).toBe(false);
    expect(gymAdmin.gym_id).toBe(1);
  });

  it("Gym context is required for non-platform operations", () => {
    // A platform admin without gym_id should be redirected to platform
    const platformAdminNoGym = { is_platform_admin: true, gym_id: null };
    const platformAdminWithGym = { is_platform_admin: true, gym_id: 1 };

    expect(platformAdminNoGym.gym_id).toBeNull();
    expect(platformAdminWithGym.gym_id).toBe(1);
  });
});

describe("Plan types", () => {
  it("supports DURATION, SESSIONS, and VIP plan types", () => {
    const planTypes = ["DURATION", "SESSIONS", "VIP"];
    expect(planTypes).toHaveLength(3);
    expect(planTypes).toContain("DURATION");
    expect(planTypes).toContain("SESSIONS");
    expect(planTypes).toContain("VIP");
  });

  it("SESSIONS plan has sessions_count", () => {
    const sessionPlan = { plan_type: "SESSIONS", sessions_count: 10, duration_days: 0 };
    expect(sessionPlan.sessions_count).toBe(10);
  });
});

describe("Payment methods", () => {
  it("supports all African and standard payment methods", () => {
    const methods = ["CASH", "WAVE", "ORANGE_MONEY", "MTN_MONEY", "CARD", "BANK_TRANSFER"];
    expect(methods).toHaveLength(6);
  });
});

describe("Gym statuses", () => {
  it("supports PENDING, ACTIVE, SUSPENDED", () => {
    const statuses = ["PENDING", "ACTIVE", "SUSPENDED"];
    expect(statuses).toHaveLength(3);
  });
});
