import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";
import { calculateRiskScore, recalculateAllRiskScores } from "../services/riskScore.js";
import { requireGymContext } from "../utils/access.js";

// ── GET /api/crm/member/:id — Fiche CRM complete ──────────────

export async function getMemberCRM(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    // Profil
    const [user] = await query<any[]>(
      "SELECT id, full_name, email, phone, role, status, member_code, sport_goal, created_at FROM users WHERE id = ? AND gym_id = ?",
      [id, gymId]
    );
    if (!user) {
      error(res, "Membre introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Abonnement actif
    const [sub] = await query<any[]>(
      `SELECT s.*, mp.name as plan_name FROM subscriptions s
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.user_id = ? AND s.gym_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC LIMIT 1`,
      [id, gymId]
    );

    // Stats paiements
    const [payStats] = await query<any[]>(
      "SELECT COALESCE(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END),0) as total_paid, COUNT(CASE WHEN status='PENDING' THEN 1 END) as pending FROM payments WHERE user_id = ? AND gym_id = ?",
      [id, gymId]
    );

    // Stats reservations
    const [resvStats] = await query<any[]>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN status='CANCELLED' THEN 1 ELSE 0 END) as cancelled,
              SUM(CASE WHEN status='NO_SHOW' THEN 1 ELSE 0 END) as no_show
       FROM reservations WHERE user_id = ? AND gym_id = ?`,
      [id, gymId]
    );

    // Presences
    const [attStats] = await query<any[]>(
      "SELECT COUNT(*) as total_visits, MAX(check_in_time) as last_visit FROM attendance_logs WHERE user_id = ? AND gym_id = ? AND status = 'VALID'",
      [id, gymId]
    );

    // Progression recente
    const progress = await query<any[]>(
      "SELECT * FROM member_progress WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 5",
      [id]
    );

    // Notes internes
    const notes = await query<any[]>(
      `SELECT mn.*, u.full_name as admin_name FROM member_notes mn
       JOIN users u ON u.id = mn.admin_id
       WHERE mn.user_id = ? ORDER BY mn.created_at DESC`,
      [id]
    );

    // Score de risque
    const risk = await calculateRiskScore(Number(id), gymId);

    // Historique des actions (logs)
    const activityLogs = await query<any[]>(
      `SELECT action, description, created_at FROM activity_logs
       WHERE target_type = 'USER' AND target_id = ?
         AND gym_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [id, gymId]
    );

    success(res, {
      profile: user,
      subscription: sub || null,
      payments: { total_paid: Number(payStats.total_paid), pending_count: payStats.pending },
      reservations: resvStats,
      attendance: { total_visits: attStats.total_visits, last_visit: attStats.last_visit },
      progress,
      notes,
      risk,
      activity_logs: activityLogs,
    });
  } catch (err) {
    console.error("[CRM] getMemberCRM error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/crm/member/:id/note — Ajouter note interne ──────

export async function addMemberNote(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      error(res, "Note requise", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const [user] = await query<any[]>("SELECT id FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'", [id, gymId]);
    if (!user) {
      error(res, "Membre introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    await query<any>(
      "INSERT INTO member_notes (user_id, admin_id, note) VALUES (?, ?, ?)",
      [id, req.user!.userId, note.trim()]
    );

    success(res, null, 201, "Note ajoutee");
  } catch (err) {
    console.error("[CRM] addMemberNote error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── DELETE /api/crm/note/:id — Supprimer note ─────────────────

export async function deleteMemberNote(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    await query<any>(
      `DELETE mn FROM member_notes mn
       JOIN users u ON u.id = mn.user_id
       WHERE mn.id = ? AND u.gym_id = ?`,
      [req.params.id, gymId]
    );
    success(res, null, 200, "Note supprimee");
  } catch (err) {
    console.error("[CRM] deleteMemberNote error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/crm/risk-scores — Tous les scores de risque ──────

export async function getAllRiskScores(req: Request, res: Response) {
  try {
    const level = req.query.level as string || "";
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    let where = "WHERE u.gym_id = ?";
    const params: any[] = [gymId];
    if (level) { where += " AND r.risk_level = ?"; params.push(level); }

    const scores = await query<any[]>(
      `SELECT r.*, u.full_name, u.member_code, u.email, u.phone, u.status
       FROM member_risk_scores r
       JOIN users u ON u.id = r.user_id
       ${where}
       ORDER BY r.score DESC`,
      params
    );

    const summary = {
      high: scores.filter((s) => s.risk_level === "HIGH").length,
      medium: scores.filter((s) => s.risk_level === "MEDIUM").length,
      low: scores.filter((s) => s.risk_level === "LOW").length,
    };

    success(res, { scores, summary });
  } catch (err) {
    console.error("[CRM] getAllRiskScores error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/crm/risk-scores/recalculate — Recalculer tous ───

export async function recalculateRiskScores(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const count = await recalculateAllRiskScores(gymId);
    success(res, { recalculated: count }, 200, `${count} score(s) recalcule(s)`);
  } catch (err) {
    console.error("[CRM] recalculateRiskScores error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
