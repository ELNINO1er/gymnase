import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";

// ── GET /api/badges — Tous les badges disponibles ──────────────

export async function getAllBadges(req: Request, res: Response) {
  try {
    const badges = await query<any[]>("SELECT * FROM badges ORDER BY criteria_type, criteria_value");
    success(res, badges);
  } catch (err) {
    console.error("[BADGES] getAllBadges error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/badges/user/:userId — Badges d'un membre ──────────

export async function getUserBadges(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const earned = await query<any[]>(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    const allBadges = await query<any[]>("SELECT * FROM badges ORDER BY criteria_type, criteria_value");

    // Marquer ceux obtenus
    const result = allBadges.map((badge) => {
      const userBadge = earned.find((e) => e.id === badge.id);
      return { ...badge, earned: !!userBadge, earned_at: userBadge?.earned_at || null };
    });

    success(res, { badges: result, earned_count: earned.length, total_count: allBadges.length });
  } catch (err) {
    console.error("[BADGES] getUserBadges error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/badges/check/:userId — Verifier et attribuer auto

export async function checkAndAwardBadges(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const awarded: string[] = [];

    // Compter seances completees
    const [sessCount] = await query<any[]>(
      "SELECT COUNT(*) as c FROM reservations WHERE user_id = ? AND status = 'COMPLETED'",
      [userId]
    );
    const completedSessions = sessCount.c;

    // Badges SESSIONS_COUNT
    const sessionBadges = await query<any[]>(
      "SELECT * FROM badges WHERE criteria_type = 'SESSIONS_COUNT' AND criteria_value <= ?",
      [completedSessions]
    );

    for (const badge of sessionBadges) {
      const [exists] = await query<any[]>(
        "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?",
        [userId, badge.id]
      );
      if (!exists) {
        await query<any>(
          "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
          [userId, badge.id]
        );
        awarded.push(badge.name);

        // Notification
        await query<any>(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, 'Badge obtenu !', ?, 'INFO')`,
          [userId, `Felicitations ! Vous avez obtenu le badge "${badge.name}" : ${badge.description}`]
        );
      }
    }

    // Badges MONTHS_ACTIVE
    const [memberSince] = await query<any[]>("SELECT created_at FROM users WHERE id = ?", [userId]);
    if (memberSince) {
      const monthsActive = Math.floor((Date.now() - new Date(memberSince.created_at).getTime()) / (30 * 86400000));
      const monthBadges = await query<any[]>(
        "SELECT * FROM badges WHERE criteria_type = 'MONTHS_ACTIVE' AND criteria_value <= ?",
        [monthsActive]
      );
      for (const badge of monthBadges) {
        const [exists] = await query<any[]>("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?", [userId, badge.id]);
        if (!exists) {
          await query<any>("INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)", [userId, badge.id]);
          awarded.push(badge.name);
          await query<any>(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Badge obtenu !', ?, 'INFO')`,
            [userId, `Felicitations ! Badge "${badge.name}" obtenu !`]
          );
        }
      }
    }

    success(res, { checked: true, newly_awarded: awarded }, 200, awarded.length > 0 ? `${awarded.length} badge(s) attribue(s)` : "Aucun nouveau badge");
  } catch (err) {
    console.error("[BADGES] checkAndAwardBadges error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/badges/award — Attribution manuelle (admin) ──────

export async function awardBadge(req: Request, res: Response) {
  try {
    const { user_id, badge_id } = req.body;
    if (!user_id || !badge_id) {
      error(res, "user_id et badge_id requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const [exists] = await query<any[]>("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?", [user_id, badge_id]);
    if (exists) {
      error(res, "Ce badge a deja ete attribue", 400, ErrorCode.ALREADY_PROCESSED);
      return;
    }

    await query<any>("INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)", [user_id, badge_id]);

    const [badge] = await query<any[]>("SELECT name, description FROM badges WHERE id = ?", [badge_id]);
    if (badge) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Badge obtenu !', ?, 'INFO')`,
        [user_id, `Badge "${badge.name}" attribue par l'administration !`]
      );
    }

    success(res, null, 201, "Badge attribue");
  } catch (err) {
    console.error("[BADGES] awardBadge error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
