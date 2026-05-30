import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error } from "../utils/response.js";

// ── GET /api/notifications — Mes notifications ─────────────────

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unread === "true";

    let where = "WHERE user_id = ?";
    if (unreadOnly) where += " AND is_read = FALSE";

    const notifications = await query<any[]>(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const [unreadCount] = await query<any[]>(
      "SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    success(res, { notifications, unread_count: unreadCount.c });
  } catch (err) {
    console.error("[NOTIF] getNotifications error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── PUT /api/notifications/:id/read — Marquer comme lue ────────

export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await query<any>(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    success(res, { message: "Notification lue" });
  } catch (err) {
    console.error("[NOTIF] markAsRead error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── PUT /api/notifications/read-all — Tout marquer comme lu ────

export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const result = await query<any>(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    success(res, { message: "Toutes les notifications marquees comme lues", count: result.affectedRows });
  } catch (err) {
    console.error("[NOTIF] markAllAsRead error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── POST /api/notifications — Envoyer une notification (admin) ─

const createNotifSchema = z.object({
  user_id: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(150),
  message: z.string().min(1).max(1000),
  type: z.enum(["INFO", "PAYMENT", "RESERVATION", "SUBSCRIPTION", "SYSTEM"]).default("INFO"),
  broadcast: z.boolean().default(false),
});

export async function createNotification(req: Request, res: Response) {
  try {
    const parsed = createNotifSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { user_id, title, message, type, broadcast } = parsed.data;

    if (broadcast) {
      // Envoyer a tous les membres actifs
      const members = await query<any[]>(
        "SELECT id FROM users WHERE status = 'ACTIVE' AND role IN ('MEMBER', 'ADMIN', 'SUPER_ADMIN')"
      );

      for (const member of members) {
        await query<any>(
          "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
          [member.id, title, message, type]
        );
      }

      success(res, { message: `Notification envoyee a ${members.length} membres`, count: members.length }, 201);
    } else {
      if (!user_id) {
        error(res, "user_id requis si broadcast est false");
        return;
      }

      await query<any>(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [user_id, title, message, type]
      );

      success(res, { message: "Notification envoyee" }, 201);
    }
  } catch (err) {
    console.error("[NOTIF] createNotification error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── DELETE /api/notifications/:id ──────────────────────────────

export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await query<any>("DELETE FROM notifications WHERE id = ? AND user_id = ?", [id, userId]);
    success(res, { message: "Notification supprimee" });
  } catch (err) {
    console.error("[NOTIF] deleteNotification error:", err);
    error(res, "Erreur serveur", 500);
  }
}
