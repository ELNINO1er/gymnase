import { Request } from "express";
import { query } from "../config/database.js";

export type LogAction =
  | "CREATE" | "UPDATE" | "DELETE"
  | "VALIDATE" | "SUSPEND" | "REACTIVATE"
  | "ACTIVATE" | "CANCEL" | "RENEW"
  | "COMPLETE" | "NO_SHOW" | "REFUND"
  | "PAY" | "LOGIN" | "SEND_NOTIFICATION";

export type LogTarget =
  | "USER" | "PLAN" | "SUBSCRIPTION"
  | "RESERVATION" | "PAYMENT" | "NOTIFICATION" | "SETTING";

interface LogEntry {
  action: LogAction;
  targetType: LogTarget;
  targetId?: number;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Enregistre une action admin dans la table activity_logs.
 * Appeler depuis n'importe quel controller apres une action reussie.
 */
export async function logActivity(req: Request, entry: LogEntry) {
  try {
    if (!req.user) return;

    const adminId = req.user.userId;
    const adminName = req.user.email || `User #${adminId}`;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    await query<any>(
      `INSERT INTO activity_logs (admin_id, admin_name, action, target_type, target_id, description, metadata, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        adminName,
        entry.action,
        entry.targetType,
        entry.targetId || null,
        entry.description,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        ip,
      ]
    );
  } catch (err) {
    // Ne jamais bloquer l'action principale si le log echoue
    console.error("[ACTIVITY_LOG] Erreur:", err);
  }
}
