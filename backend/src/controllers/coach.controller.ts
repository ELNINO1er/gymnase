import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error } from "../utils/response.js";
import { requireGymContext } from "../utils/access.js";

// ── GET /api/coach/dashboard — Dashboard coach ──────────────

export async function getCoachDashboard(req: Request, res: Response) {
  try {
    const coachId = req.user!.userId;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    // Plans actifs du coach
    const [planStats] = await query<any[]>(
      `SELECT
        COUNT(*) AS total_plans,
        SUM(status = 'ACTIVE') AS active_plans,
        SUM(status = 'COMPLETED') AS completed_plans
       FROM workout_plans WHERE coach_id = ?`,
      [coachId]
    );

    // Membres suivis (ayant un plan actif)
    const [memberStats] = await query<any[]>(
      `SELECT COUNT(DISTINCT user_id) AS total_members
       FROM workout_plans WHERE coach_id = ? AND status = 'ACTIVE'`,
      [coachId]
    );

    // Seances assignees au coach aujourd'hui
    const todaySessions = await query<any[]>(
      `SELECT s.name, ts.start_time, ts.end_time, ts.day_of_week,
              (SELECT COUNT(*) FROM reservations r
               WHERE r.session_id = s.id AND r.reservation_date = CURDATE()
                 AND r.status NOT IN ('CANCELLED', 'NO_SHOW')) AS bookings,
              s.capacity
       FROM sessions s
       JOIN time_slots ts ON ts.session_id = s.id AND ts.is_active = TRUE
       WHERE s.gym_id = ? AND s.coach_id = ?
         AND ts.day_of_week = UPPER(DAYNAME(CURDATE()))
       ORDER BY ts.start_time`,
      [gymId, coachId]
    );

    // Prochaines seances (7 jours)
    const upcomingSessions = await query<any[]>(
      `SELECT s.id, s.name, s.capacity, ts.start_time, ts.end_time, ts.day_of_week
       FROM sessions s
       JOIN time_slots ts ON ts.session_id = s.id AND ts.is_active = TRUE
       WHERE s.gym_id = ? AND s.coach_id = ?
       ORDER BY FIELD(ts.day_of_week, 'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'), ts.start_time
       LIMIT 20`,
      [gymId, coachId]
    );

    success(res, {
      plans: planStats || { total_plans: 0, active_plans: 0, completed_plans: 0 },
      members_count: memberStats?.total_members || 0,
      today_sessions: todaySessions,
      upcoming_sessions: upcomingSessions,
    });
  } catch (err) {
    console.error("[COACH] dashboard error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/coach/sessions — Seances du coach ──────────────

export async function getCoachSessions(req: Request, res: Response) {
  try {
    const coachId = req.user!.userId;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const sessions = await query<any[]>(
      `SELECT s.*, GROUP_CONCAT(
         CONCAT(ts.day_of_week, ' ', ts.start_time, '-', ts.end_time) SEPARATOR ', '
       ) AS schedule
       FROM sessions s
       LEFT JOIN time_slots ts ON ts.session_id = s.id AND ts.is_active = TRUE
       WHERE s.gym_id = ? AND s.coach_id = ?
       GROUP BY s.id
       ORDER BY s.name`,
      [gymId, coachId]
    );

    success(res, sessions);
  } catch (err) {
    console.error("[COACH] getSessions error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/coach/members — Membres suivis par le coach ────

export async function getCoachMembers(req: Request, res: Response) {
  try {
    const coachId = req.user!.userId;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const members = await query<any[]>(
      `SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.member_code, u.sport_goal, u.status,
        (SELECT COUNT(*) FROM workout_plans wp2 WHERE wp2.user_id = u.id AND wp2.coach_id = ? AND wp2.status = 'ACTIVE') AS active_plans,
        (SELECT MAX(al.check_in_time) FROM attendance_logs al WHERE al.user_id = u.id AND al.status = 'VALID') AS last_visit
       FROM users u
       JOIN workout_plans wp ON wp.user_id = u.id AND wp.coach_id = ?
       WHERE u.gym_id = ? AND u.status != 'DELETED'
       ORDER BY u.full_name`,
      [coachId, coachId, gymId]
    );

    success(res, members);
  } catch (err) {
    console.error("[COACH] getMembers error:", err);
    error(res, "Erreur serveur", 500);
  }
}
