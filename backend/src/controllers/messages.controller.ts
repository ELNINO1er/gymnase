import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, paginated, ErrorCode } from "../utils/response.js";

const sendSchema = z.object({
  receiver_id: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(2000),
  type: z.enum(["PRIVATE", "GROUP", "BROADCAST"]).default("PRIVATE"),
  target_group: z.enum(["ALL", "MEMBERS", "EXPIRED", "INACTIVE", "COACHES"]).optional().nullable(),
});

// ── GET /api/messages/inbox — Mes messages recus ───────────────

export async function getInbox(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [cnt] = await query<any[]>(
      "SELECT COUNT(*) as total FROM messages WHERE receiver_id = ?", [userId]
    );

    const messages = await query<any[]>(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.receiver_id = ?
       ORDER BY m.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [userId]
    );

    const [unread] = await query<any[]>(
      "SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = FALSE", [userId]
    );

    paginated(res, messages, cnt.total, page, limit);
  } catch (err) {
    console.error("[MESSAGES] getInbox error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/messages/sent — Mes messages envoyes (admin) ──────

export async function getSent(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const messages = await query<any[]>(
      `SELECT m.*, u.full_name as receiver_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.receiver_id
       WHERE m.sender_id = ?
       ORDER BY m.created_at DESC LIMIT 50`,
      [userId]
    );

    success(res, messages);
  } catch (err) {
    console.error("[MESSAGES] getSent error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/messages/send — Envoyer un message ──────────────

export async function sendMessage(req: Request, res: Response) {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "), 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const { receiver_id, title, content, type, target_group } = parsed.data;
    const senderId = req.user!.userId;
    const senderRole = req.user!.role;
    const senderGymId = req.user!.gymId;
    const isAdminSender = ["ADMIN", "SUPER_ADMIN"].includes(senderRole);
    let sentCount = 0;

    if (!isAdminSender) {
      if (type !== "PRIVATE" || !receiver_id) {
        error(res, "Un membre peut uniquement envoyer un message prive a l'administration", 400, ErrorCode.VALIDATION_ERROR);
        return;
      }

      const [admin] = await query<any[]>(
        `SELECT id FROM users
         WHERE id = ? AND gym_id = ? AND role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'`,
        [receiver_id, senderGymId]
      );

      if (!admin) {
        error(res, "Destinataire admin introuvable dans cette salle", 404, ErrorCode.NOT_FOUND);
        return;
      }
    }

    if (type === "PRIVATE") {
      if (!receiver_id) {
        error(res, "receiver_id requis pour un message prive", 400, ErrorCode.VALIDATION_ERROR);
        return;
      }
      if (isAdminSender) {
        const [receiver] = await query<any[]>(
          "SELECT id FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'",
          [receiver_id, senderGymId]
        );
        if (!receiver) {
          error(res, "Destinataire introuvable dans cette salle", 404, ErrorCode.NOT_FOUND);
          return;
        }
      }
      await query<any>(
        "INSERT INTO messages (sender_id, receiver_id, title, content, type) VALUES (?, ?, ?, ?, 'PRIVATE')",
        [senderId, receiver_id, title, content]
      );
      sentCount = 1;
    } else if (type === "GROUP" && target_group) {
      if (!isAdminSender) {
        error(res, "Acces refuse", 403, ErrorCode.FORBIDDEN);
        return;
      }
      // Determiner les destinataires selon le groupe
      let condition = "WHERE gym_id = ? AND status != 'DELETED'";
      const recipientParams: any[] = [senderGymId];
      if (target_group === "MEMBERS") condition += " AND role = 'MEMBER' AND status = 'ACTIVE'";
      else if (target_group === "EXPIRED") condition += " AND status = 'EXPIRED'";
      else if (target_group === "COACHES") condition += " AND role = 'COACH'";
      else if (target_group === "INACTIVE") {
        condition += ` AND role = 'MEMBER' AND id NOT IN (
          SELECT DISTINCT user_id FROM attendance_logs WHERE status = 'VALID' AND check_in_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )`;
      }

      const recipients = await query<any[]>(`SELECT id FROM users ${condition}`, recipientParams);
      for (const r of recipients) {
        await query<any>(
          "INSERT INTO messages (sender_id, receiver_id, title, content, type, target_group) VALUES (?, ?, ?, ?, 'GROUP', ?)",
          [senderId, r.id, title, content, target_group]
        );
      }
      sentCount = recipients.length;
    } else if (type === "BROADCAST") {
      if (!isAdminSender) {
        error(res, "Acces refuse", 403, ErrorCode.FORBIDDEN);
        return;
      }
      const recipients = await query<any[]>(
        "SELECT id FROM users WHERE gym_id = ? AND status != 'DELETED' AND id != ?",
        [senderGymId, senderId]
      );
      for (const r of recipients) {
        await query<any>(
          "INSERT INTO messages (sender_id, receiver_id, title, content, type) VALUES (?, ?, ?, ?, 'BROADCAST')",
          [senderId, r.id, title, content]
        );
      }
      sentCount = recipients.length;
    }

    success(res, { sent_count: sentCount }, 201, `Message envoye a ${sentCount} destinataire(s)`);
  } catch (err) {
    console.error("[MESSAGES] sendMessage error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── PUT /api/messages/:id/read — Marquer comme lu ──────────────

export async function markMessageRead(req: Request, res: Response) {
  try {
    await query<any>(
      "UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?",
      [req.params.id, req.user!.userId]
    );
    success(res, null, 200, "Message lu");
  } catch (err) {
    console.error("[MESSAGES] markMessageRead error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/messages/unread-count — Nombre non lus ────────────

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const [result] = await query<any[]>(
      "SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = FALSE",
      [req.user!.userId]
    );
    success(res, { unread: result.c });
  } catch (err) {
    console.error("[MESSAGES] getUnreadCount error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
