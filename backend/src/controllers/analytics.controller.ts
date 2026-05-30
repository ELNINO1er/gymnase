import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";

// ── GET /api/analytics/peak-hours — Heures fortes ──────────────

export async function getPeakHours(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 30;

    const hourly = await query<any[]>(
      `SELECT HOUR(check_in_time) as hour, COUNT(*) as entries,
              ROUND(COUNT(*) / ?, 1) as avg_per_day
       FROM attendance_logs
       WHERE status = 'VALID' AND check_in_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY HOUR(check_in_time)
       ORDER BY entries DESC`,
      [days, days]
    );

    success(res, { period_days: days, hours: hourly });
  } catch (err) {
    console.error("[ANALYTICS] getPeakHours error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/analytics/popular-sessions — Seances populaires ───

export async function getPopularSessions(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 30;

    const sessions = await query<any[]>(
      `SELECT s.name, s.capacity, COUNT(r.id) as total_bookings,
              SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN r.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
              SUM(CASE WHEN r.status = 'NO_SHOW' THEN 1 ELSE 0 END) as no_show,
              ROUND(COUNT(r.id) / ?, 1) as avg_per_day
       FROM sessions s
       LEFT JOIN reservations r ON r.session_id = s.id
         AND r.reservation_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       WHERE s.is_active = TRUE
       GROUP BY s.id, s.name, s.capacity
       ORDER BY total_bookings DESC`,
      [days, days]
    );

    success(res, { period_days: days, sessions });
  } catch (err) {
    console.error("[ANALYTICS] getPopularSessions error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/analytics/profitable-days — Jours les plus rentables

export async function getProfitableDays(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 90;

    const byDayOfWeek = await query<any[]>(
      `SELECT DAYNAME(paid_at) as day_name, DAYOFWEEK(paid_at) as day_num,
              COUNT(*) as payments, COALESCE(SUM(amount), 0) as revenue
       FROM payments
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DAYNAME(paid_at), DAYOFWEEK(paid_at)
       ORDER BY revenue DESC`,
      [days]
    );

    success(res, { period_days: days, days: byDayOfWeek });
  } catch (err) {
    console.error("[ANALYTICS] getProfitableDays error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/analytics/top-members — Membres les plus actifs ───

export async function getTopMembers(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 30;
    const limitN = Math.min(50, Number(req.query.limit) || 10);

    const members = await query<any[]>(
      `SELECT u.id, u.full_name, u.member_code,
              COUNT(DISTINCT a.id) as visits,
              COUNT(DISTINCT r.id) as reservations,
              COALESCE(SUM(DISTINCT CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) as total_paid
       FROM users u
       LEFT JOIN attendance_logs a ON a.user_id = u.id AND a.status = 'VALID' AND a.check_in_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LEFT JOIN reservations r ON r.user_id = u.id AND r.reservation_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND r.status NOT IN ('CANCELLED')
       LEFT JOIN payments p ON p.user_id = u.id AND p.paid_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       WHERE u.role = 'MEMBER' AND u.status = 'ACTIVE'
       GROUP BY u.id, u.full_name, u.member_code
       ORDER BY visits DESC
       LIMIT ${Number(limitN)}`,
      [days, days, days]
    );

    success(res, { period_days: days, members });
  } catch (err) {
    console.error("[ANALYTICS] getTopMembers error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/analytics/retention — Taux de retention ───────────

export async function getRetention(req: Request, res: Response) {
  try {
    const [totalMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE role = 'MEMBER' AND status != 'DELETED'");
    const [active] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE role = 'MEMBER' AND status = 'ACTIVE'");
    const [expired] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE role = 'MEMBER' AND status = 'EXPIRED'");
    const [suspended] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE role = 'MEMBER' AND status = 'SUSPENDED'");

    const retentionRate = totalMembers.c > 0 ? Math.round((active.c / totalMembers.c) * 100) : 0;

    // Renewals vs expirations ce mois
    const [renewed] = await query<any[]>(
      `SELECT COUNT(*) as c FROM subscriptions
       WHERE status = 'ACTIVE' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
         AND user_id IN (SELECT user_id FROM subscriptions WHERE status = 'EXPIRED')`
    );
    const [expiredThisMonth] = await query<any[]>(
      `SELECT COUNT(*) as c FROM subscriptions
       WHERE status = 'EXPIRED' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
    );

    success(res, {
      total_members: totalMembers.c,
      active: active.c,
      expired: expired.c,
      suspended: suspended.c,
      retention_rate: retentionRate,
      renewals_this_month: renewed.c,
      expirations_this_month: expiredThisMonth.c,
    });
  } catch (err) {
    console.error("[ANALYTICS] getRetention error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
