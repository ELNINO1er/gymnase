import { Request, Response } from "express";
import crypto from "crypto";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";
import { logActivity } from "../services/activityLog.js";

/**
 * Genere un token QR unique pour un utilisateur.
 */
function generateQrToken(userId: number): string {
  const random = crypto.randomBytes(16).toString("hex");
  return `EG${userId}-${random}`;
}

// ── GET /api/qrcode/my — Mon QR code (membre) ─────────────────

export async function getMyQrCode(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const [user] = await query<any[]>(
      "SELECT id, full_name, member_code, qr_code_token, status FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      error(res, "Utilisateur introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Generer le token s'il n'existe pas encore
    let token = user.qr_code_token;
    if (!token) {
      token = generateQrToken(userId);
      await query<any>("UPDATE users SET qr_code_token = ? WHERE id = ?", [token, userId]);
    }

    success(res, {
      qr_token: token,
      member_code: user.member_code,
      full_name: user.full_name,
      status: user.status,
    });
  } catch (err) {
    console.error("[QRCODE] getMyQrCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/qrcode/verify — Scanner/verifier un QR code ─────

export async function verifyQrCode(req: Request, res: Response) {
  try {
    const { qr_token } = req.body;

    if (!qr_token || typeof qr_token !== "string") {
      error(res, "Token QR requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    // Trouver l'utilisateur
    const [user] = await query<any[]>(
      "SELECT id, full_name, member_code, email, phone, role, status FROM users WHERE qr_code_token = ?",
      [qr_token]
    );

    if (!user) {
      error(res, "QR code invalide ou inconnu", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Verifier le statut
    if (user.status !== "ACTIVE") {
      // Log de tentative refusee
      await query<any>(
        `INSERT INTO attendance_logs (user_id, method, status, reason) VALUES (?, 'QR_CODE', 'DENIED', ?)`,
        [user.id, `Compte ${user.status}`]
      );

      error(res, `Acces refuse : compte ${user.status}`, 403, ErrorCode.FORBIDDEN);
      return;
    }

    // Verifier l'abonnement
    const [activeSub] = await query<any[]>(
      `SELECT s.id, mp.name as plan_name, s.end_date
       FROM subscriptions s
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC LIMIT 1`,
      [user.id]
    );

    if (!activeSub && user.role === "MEMBER") {
      await query<any>(
        `INSERT INTO attendance_logs (user_id, method, status, reason) VALUES (?, 'QR_CODE', 'DENIED', 'Abonnement expire')`,
        [user.id]
      );

      error(res, "Abonnement expire", 403, ErrorCode.NO_ACTIVE_SUBSCRIPTION);
      return;
    }

    // Verifier paiements en retard
    const [pendingPayments] = await query<any[]>(
      "SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = 'PENDING'",
      [user.id]
    );

    // Check-in automatique
    await query<any>(
      `INSERT INTO attendance_logs (user_id, method, status) VALUES (?, 'QR_CODE', 'VALID')`,
      [user.id]
    );

    const daysLeft = activeSub
      ? Math.max(0, Math.ceil((new Date(activeSub.end_date).getTime() - Date.now()) / 86400000))
      : null;

    success(res, {
      access: "GRANTED",
      member: {
        id: user.id,
        full_name: user.full_name,
        member_code: user.member_code,
        role: user.role,
        status: user.status,
      },
      subscription: activeSub ? {
        plan_name: activeSub.plan_name,
        end_date: activeSub.end_date,
        days_left: daysLeft,
      } : null,
      pending_payments: pendingPayments.count,
      checked_in: true,
    }, 200, "Acces autorise");
  } catch (err) {
    console.error("[QRCODE] verifyQrCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/qrcode/regenerate — Regenerer le QR code ────────

export async function regenerateQrCode(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const token = generateQrToken(userId);

    await query<any>("UPDATE users SET qr_code_token = ? WHERE id = ?", [token, userId]);

    success(res, { qr_token: token }, 200, "QR code regenere");
  } catch (err) {
    console.error("[QRCODE] regenerateQrCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
