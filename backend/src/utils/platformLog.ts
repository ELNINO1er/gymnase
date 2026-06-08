import { Request } from "express";
import { query } from "../config/database.js";

type TargetType = "GYM" | "USER" | "PLATFORM" | "SETTINGS";

export async function logPlatformAction(
  req: Request,
  action: string,
  targetType: TargetType,
  targetId?: number | null,
  details?: Record<string, unknown>
) {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return;

    const ip = req.ip || req.headers["x-forwarded-for"] || null;

    await query(
      `INSERT INTO platform_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        action,
        targetType,
        targetId || null,
        details ? JSON.stringify(details) : null,
        ip,
      ]
    );
  } catch (err) {
    console.error("[PLATFORM_LOG] Error:", err);
  }
}
