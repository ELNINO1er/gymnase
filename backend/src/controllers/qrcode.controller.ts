import { Request, Response } from "express";
import crypto from "crypto";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";
import { logActivity } from "../services/activityLog.js";
import { requireGymContext } from "../utils/access.js";

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
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const [user] = await query<any[]>(
      "SELECT id, full_name, member_code, qr_code_token, status FROM users WHERE id = ? AND gym_id = ?",
      [userId, gymId]
    );

    if (!user) {
      error(res, "Utilisateur introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Generer le token s'il n'existe pas encore
    let token = user.qr_code_token;
    if (!token) {
      token = generateQrToken(userId);
      await query<any>("UPDATE users SET qr_code_token = ? WHERE id = ? AND gym_id = ?", [token, userId, gymId]);
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
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    if (!qr_token || typeof qr_token !== "string") {
      error(res, "Token QR requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    // Trouver l'utilisateur
    const [user] = await query<any[]>(
      "SELECT id, gym_id, full_name, member_code, email, phone, role, status FROM users WHERE qr_code_token = ? AND gym_id = ?",
      [qr_token, gymId]
    );

    if (!user) {
      error(res, "QR code invalide ou inconnu", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Verifier le statut
    if (user.status !== "ACTIVE") {
      // Log de tentative refusee
      await query<any>(
        `INSERT INTO attendance_logs (gym_id, user_id, method, status, reason) VALUES (?, ?, 'QR_CODE', 'DENIED', ?)`,
        [gymId, user.id, `Compte ${user.status}`]
      );

      error(res, `Acces refuse : compte ${user.status}`, 403, ErrorCode.FORBIDDEN);
      return;
    }

    // Verifier l'abonnement
    const [activeSub] = await query<any[]>(
      `SELECT s.id, mp.name as plan_name, s.end_date
       FROM subscriptions s
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.gym_id = ? AND s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC LIMIT 1`,
      [gymId, user.id]
    );

    if (!activeSub && user.role === "MEMBER") {
      await query<any>(
        `INSERT INTO attendance_logs (gym_id, user_id, method, status, reason) VALUES (?, ?, 'QR_CODE', 'DENIED', 'Abonnement expire')`,
        [gymId, user.id]
      );

      error(res, "Abonnement expire", 403, ErrorCode.NO_ACTIVE_SUBSCRIPTION);
      return;
    }

    // Verifier paiements en retard
    const [pendingPayments] = await query<any[]>(
      "SELECT COUNT(*) as count FROM payments WHERE gym_id = ? AND user_id = ? AND status = 'PENDING'",
      [gymId, user.id]
    );

    // Check-in automatique
    await query<any>(
      `INSERT INTO attendance_logs (gym_id, user_id, method, status) VALUES (?, ?, 'QR_CODE', 'VALID')`,
      [gymId, user.id]
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

// ── POST /api/qrcode/scan — Scan public pour la borne (pas de token) ─

export async function scanQrCode(req: Request, res: Response) {
  try {
    const { qr_token } = req.body;

    if (!qr_token || typeof qr_token !== "string") {
      error(res, "Token QR requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    // Trouver l'utilisateur par token QR
    const [user] = await query<any[]>(
      "SELECT id, gym_id, full_name, member_code, email, phone, role, status, sport_goal FROM users WHERE qr_code_token = ?",
      [qr_token]
    );

    if (!user) {
      error(res, "QR code invalide ou inconnu", 404, ErrorCode.NOT_FOUND);
      return;
    }

    const gymId = Number(user.gym_id);
    if (!Number.isInteger(gymId) || gymId <= 0) {
      error(res, "Salle introuvable pour ce QR code", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Verifier le statut
    if (user.status !== "ACTIVE") {
      await query<any>(
        `INSERT INTO attendance_logs (gym_id, user_id, method, status, reason) VALUES (?, ?, 'QR_CODE', 'DENIED', ?)`,
        [gymId, user.id, `Compte ${user.status}`]
      );
      error(res, `Acces refuse : compte ${user.status}`, 403, ErrorCode.FORBIDDEN);
      return;
    }

    // Verifier l'abonnement
    const [activeSub] = await query<any[]>(
      `SELECT s.id, mp.name as plan_name, s.end_date, s.start_date
       FROM subscriptions s
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.gym_id = ? AND s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC LIMIT 1`,
      [gymId, user.id]
    );

    if (!activeSub && user.role === "MEMBER") {
      await query<any>(
        `INSERT INTO attendance_logs (gym_id, user_id, method, status, reason) VALUES (?, ?, 'QR_CODE', 'DENIED', 'Abonnement expire')`,
        [gymId, user.id]
      );
      error(res, "Abonnement expire", 403, ErrorCode.NO_ACTIVE_SUBSCRIPTION);
      return;
    }

    // Paiements en retard
    const [pendingPayments] = await query<any[]>(
      "SELECT COUNT(*) as count FROM payments WHERE gym_id = ? AND user_id = ? AND status = 'PENDING'",
      [gymId, user.id]
    );

    // Check-in automatique (eviter doublon si deja checked-in aujourd'hui)
    const [alreadyIn] = await query<any[]>(
      `SELECT id FROM attendance_logs WHERE gym_id = ? AND user_id = ? AND check_out_time IS NULL AND DATE(check_in_time) = CURDATE() AND status = 'VALID'`,
      [gymId, user.id]
    );

    let checkedIn = false;
    if (!alreadyIn) {
      await query<any>(
        `INSERT INTO attendance_logs (gym_id, user_id, method, status) VALUES (?, ?, 'QR_CODE', 'VALID')`,
        [gymId, user.id]
      );
      checkedIn = true;
    }

    const daysLeft = activeSub
      ? Math.max(0, Math.ceil((new Date(activeSub.end_date).getTime() - Date.now()) / 86400000))
      : null;

    // Stats du membre
    const [visitCount] = await query<any[]>(
      "SELECT COUNT(*) as c FROM attendance_logs WHERE gym_id = ? AND user_id = ? AND status = 'VALID'",
      [gymId, user.id]
    );

    success(res, {
      access: "GRANTED",
      member: {
        id: user.id,
        full_name: user.full_name,
        member_code: user.member_code,
        phone: user.phone,
        role: user.role,
        status: user.status,
        sport_goal: user.sport_goal,
        total_visits: visitCount.c,
      },
      subscription: activeSub ? {
        plan_name: activeSub.plan_name,
        start_date: activeSub.start_date,
        end_date: activeSub.end_date,
        days_left: daysLeft,
      } : null,
      pending_payments: pendingPayments.count,
      already_in: !!alreadyIn,
      checked_in: checkedIn,
    }, 200, checkedIn ? "Bienvenue ! Entree enregistree." : "Deja enregistre aujourd'hui.");
  } catch (err) {
    console.error("[QRCODE] scanQrCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/qrcode/self-checkin — Le membre se check-in lui-meme ─

export async function selfCheckIn(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    // Verifier statut
    const [user] = await query<any[]>(
      "SELECT id, full_name, member_code, status, role FROM users WHERE id = ? AND gym_id = ?",
      [userId, gymId]
    );

    if (!user || user.status !== "ACTIVE") {
      error(res, `Acces refuse : compte ${user?.status || "inconnu"}`, 403, ErrorCode.FORBIDDEN);
      return;
    }

    // Verifier abonnement
    if (user.role === "MEMBER") {
      const [activeSub] = await query<any[]>(
        `SELECT s.id, mp.name as plan_name, s.end_date
         FROM subscriptions s JOIN membership_plans mp ON mp.id = s.plan_id
         WHERE s.gym_id = ? AND s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
         ORDER BY s.end_date DESC LIMIT 1`,
        [gymId, userId]
      );

      if (!activeSub) {
        await query<any>(
          `INSERT INTO attendance_logs (gym_id, user_id, method, status, reason) VALUES (?, ?, 'QR_CODE', 'DENIED', 'Abonnement expire')`,
          [gymId, userId]
        );
        error(res, "Abonnement expire", 403, ErrorCode.NO_ACTIVE_SUBSCRIPTION);
        return;
      }

      const daysLeft = Math.max(0, Math.ceil((new Date(activeSub.end_date).getTime() - Date.now()) / 86400000));

      // Verifier si deja checked-in
      const [alreadyIn] = await query<any[]>(
        `SELECT id FROM attendance_logs WHERE gym_id = ? AND user_id = ? AND check_out_time IS NULL AND DATE(check_in_time) = CURDATE() AND status = 'VALID'`,
        [gymId, userId]
      );

      let checkedIn = false;
      if (!alreadyIn) {
        await query<any>(
          `INSERT INTO attendance_logs (gym_id, user_id, method, status) VALUES (?, ?, 'QR_CODE', 'VALID')`,
          [gymId, userId]
        );
        checkedIn = true;
      }

      const [visitCount] = await query<any[]>(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE gym_id = ? AND user_id = ? AND status = 'VALID'",
        [gymId, userId]
      );

      success(res, {
        access: "GRANTED",
        member: { full_name: user.full_name, member_code: user.member_code, total_visits: visitCount.c },
        subscription: { plan_name: activeSub.plan_name, days_left: daysLeft },
        checked_in: checkedIn,
        already_in: !!alreadyIn,
      }, 200, checkedIn ? "Bienvenue ! Entree enregistree." : "Deja enregistre aujourd'hui.");
      return;
    }

    // Admin/Coach : check-in direct
    const [alreadyIn] = await query<any[]>(
      `SELECT id FROM attendance_logs WHERE gym_id = ? AND user_id = ? AND check_out_time IS NULL AND DATE(check_in_time) = CURDATE() AND status = 'VALID'`,
      [gymId, userId]
    );
    if (!alreadyIn) {
      await query<any>(`INSERT INTO attendance_logs (gym_id, user_id, method, status) VALUES (?, ?, 'QR_CODE', 'VALID')`, [gymId, userId]);
    }

    success(res, { access: "GRANTED", member: { full_name: user.full_name }, checked_in: !alreadyIn, already_in: !!alreadyIn }, 200, "Bienvenue !");
  } catch (err) {
    console.error("[QRCODE] selfCheckIn error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/qrcode/regenerate — Regenerer le QR code ────────

export async function regenerateQrCode(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;
    const token = generateQrToken(userId);

    await query<any>("UPDATE users SET qr_code_token = ? WHERE id = ? AND gym_id = ?", [token, userId, gymId]);

    success(res, { qr_token: token }, 200, "QR code regenere");
  } catch (err) {
    console.error("[QRCODE] regenerateQrCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
