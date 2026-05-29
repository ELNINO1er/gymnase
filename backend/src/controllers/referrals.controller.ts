import { Request, Response } from "express";
import crypto from "crypto";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";

// GET /api/referrals/my-code — Mon code de parrainage
export async function getMyReferralCode(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const [user] = await query<any[]>("SELECT referral_code, full_name FROM users WHERE id = ?", [userId]);

    let code = user.referral_code;
    if (!code) {
      code = `REF${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      await query<any>("UPDATE users SET referral_code = ? WHERE id = ?", [code, userId]);
    }

    // Compter parrainages
    const [stats] = await query<any[]>(
      "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved FROM referrals WHERE referrer_id = ?",
      [userId]
    );

    success(res, { referral_code: code, total_referrals: stats.total, approved: stats.approved });
  } catch (err) {
    console.error("[REFERRALS] getMyReferralCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// POST /api/referrals/use — Utiliser un code de parrainage (a l'inscription)
export async function useReferralCode(req: Request, res: Response) {
  try {
    const { referral_code } = req.body;
    const userId = req.user!.userId;

    if (!referral_code) {
      error(res, "Code de parrainage requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    // Trouver le parrain
    const [referrer] = await query<any[]>(
      "SELECT id, full_name FROM users WHERE referral_code = ? AND status = 'ACTIVE'",
      [String(referral_code).toUpperCase()]
    );

    if (!referrer) {
      error(res, "Code de parrainage invalide", 404, ErrorCode.NOT_FOUND);
      return;
    }

    if (referrer.id === userId) {
      error(res, "Vous ne pouvez pas utiliser votre propre code");
      return;
    }

    // Verifier si deja parraine
    const [existing] = await query<any[]>("SELECT id FROM referrals WHERE referred_user_id = ?", [userId]);
    if (existing) {
      error(res, "Vous avez deja utilise un code de parrainage", 400, ErrorCode.ALREADY_PROCESSED);
      return;
    }

    await query<any>(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, reward_type, status)
       VALUES (?, ?, ?, 'DISCOUNT', 'PENDING')`,
      [referrer.id, userId, referral_code]
    );

    // Notification au parrain
    await query<any>(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Nouveau filleul', ?, 'INFO')`,
      [referrer.id, `Quelqu'un a utilise votre code de parrainage ! En attente de validation.`]
    );

    success(res, { referrer_name: referrer.full_name }, 201, "Code de parrainage enregistre");
  } catch (err) {
    console.error("[REFERRALS] useReferralCode error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/referrals — Liste (admin)
export async function getAllReferrals(req: Request, res: Response) {
  try {
    const referrals = await query<any[]>(
      `SELECT r.*, rr.full_name as referrer_name, rd.full_name as referred_name
       FROM referrals r
       JOIN users rr ON rr.id = r.referrer_id
       JOIN users rd ON rd.id = r.referred_user_id
       ORDER BY r.created_at DESC`
    );
    success(res, referrals);
  } catch (err) {
    console.error("[REFERRALS] getAllReferrals error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// PUT /api/referrals/:id/approve
export async function approveReferral(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await query<any>("UPDATE referrals SET status = 'APPROVED' WHERE id = ?", [id]);

    const [ref] = await query<any[]>("SELECT referrer_id FROM referrals WHERE id = ?", [id]);
    if (ref) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Parrainage approuve', 'Votre parrainage a ete approuve. Votre recompense est disponible.', 'INFO')`,
        [ref.referrer_id]
      );
    }

    success(res, null, 200, "Parrainage approuve");
  } catch (err) {
    console.error("[REFERRALS] approveReferral error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
