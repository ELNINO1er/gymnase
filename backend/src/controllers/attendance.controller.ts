import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, paginated, ErrorCode } from "../utils/response.js";

// ── GET /api/attendance/in-gym — Qui est dans la salle ─────────

export async function getInGym(req: Request, res: Response) {
  try {
    const members = await query<any[]>(
      `SELECT a.id, a.user_id, a.check_in_time, a.method,
              u.full_name, u.member_code, u.phone
       FROM attendance_logs a
       JOIN users u ON u.id = a.user_id
       WHERE a.check_out_time IS NULL AND a.status = 'VALID' AND DATE(a.check_in_time) = CURDATE()
       ORDER BY a.check_in_time DESC`
    );

    success(res, { count: members.length, members });
  } catch (err) {
    console.error("[ATTENDANCE] getInGym error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/attendance/check-in — Enregistrer entree ─────────

export async function manualCheckIn(req: Request, res: Response) {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      error(res, "user_id requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const [user] = await query<any[]>("SELECT id, full_name, status FROM users WHERE id = ?", [user_id]);
    if (!user) {
      error(res, "Membre introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Verifier si deja checked-in aujourd'hui sans checkout
    const [existing] = await query<any[]>(
      `SELECT id FROM attendance_logs WHERE user_id = ? AND check_out_time IS NULL AND DATE(check_in_time) = CURDATE() AND status = 'VALID'`,
      [user_id]
    );

    if (existing) {
      error(res, `${user.full_name} est deja dans la salle`, 400, ErrorCode.ALREADY_PROCESSED);
      return;
    }

    const status = user.status === "ACTIVE" ? "VALID" : "DENIED";
    const reason = user.status !== "ACTIVE" ? `Compte ${user.status}` : null;

    await query<any>(
      `INSERT INTO attendance_logs (user_id, method, status, reason) VALUES (?, 'MANUAL', ?, ?)`,
      [user_id, status, reason]
    );

    if (status === "DENIED") {
      error(res, `Acces refuse : compte ${user.status}`, 403, ErrorCode.FORBIDDEN);
      return;
    }

    success(res, { message: `${user.full_name} enregistre`, checked_in: true }, 200, "Check-in effectue");
  } catch (err) {
    console.error("[ATTENDANCE] manualCheckIn error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── POST /api/attendance/check-out — Enregistrer sortie ────────

export async function checkOut(req: Request, res: Response) {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      error(res, "user_id requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const result = await query<any>(
      `UPDATE attendance_logs SET check_out_time = NOW()
       WHERE user_id = ? AND check_out_time IS NULL AND status = 'VALID' AND DATE(check_in_time) = CURDATE()
       ORDER BY check_in_time DESC LIMIT 1`,
      [user_id]
    );

    if (result.affectedRows === 0) {
      error(res, "Aucun check-in actif trouve", 404, ErrorCode.NOT_FOUND);
      return;
    }

    success(res, { checked_out: true }, 200, "Check-out effectue");
  } catch (err) {
    console.error("[ATTENDANCE] checkOut error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/attendance/today — Presences du jour ──────────────

export async function getTodayAttendance(req: Request, res: Response) {
  try {
    const logs = await query<any[]>(
      `SELECT a.*, u.full_name, u.member_code
       FROM attendance_logs a
       JOIN users u ON u.id = a.user_id
       WHERE DATE(a.check_in_time) = CURDATE()
       ORDER BY a.check_in_time DESC`
    );

    const valid = logs.filter((l) => l.status === "VALID");
    const denied = logs.filter((l) => l.status === "DENIED");
    const stillIn = valid.filter((l) => !l.check_out_time);

    success(res, {
      logs,
      stats: {
        total_entries: valid.length,
        denied: denied.length,
        currently_in: stillIn.length,
      },
    });
  } catch (err) {
    console.error("[ATTENDANCE] getTodayAttendance error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/attendance/history — Historique pagine ────────────

export async function getAttendanceHistory(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = (page - 1) * limit;
    const userId = req.query.user_id as string || "";
    const dateFrom = req.query.date_from as string || "";
    const dateTo = req.query.date_to as string || "";

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (userId) { where += " AND a.user_id = ?"; params.push(userId); }
    if (dateFrom) { where += " AND DATE(a.check_in_time) >= ?"; params.push(dateFrom); }
    if (dateTo) { where += " AND DATE(a.check_in_time) <= ?"; params.push(dateTo); }

    const [countResult] = await query<any[]>(`SELECT COUNT(*) as total FROM attendance_logs a ${where}`, params);

    const logs = await query<any[]>(
      `SELECT a.*, u.full_name, u.member_code
       FROM attendance_logs a
       JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.check_in_time DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    paginated(res, logs, countResult.total, page, limit);
  } catch (err) {
    console.error("[ATTENDANCE] getAttendanceHistory error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/attendance/stats — Stats de frequentation ─────────

export async function getAttendanceStats(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 30;

    // Frequentation par jour
    const daily = await query<any[]>(
      `SELECT DATE(check_in_time) as day, COUNT(*) as entries
       FROM attendance_logs
       WHERE status = 'VALID' AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(check_in_time)
       ORDER BY day ASC`,
      [days]
    );

    // Frequentation par heure (heures fortes)
    const hourly = await query<any[]>(
      `SELECT HOUR(check_in_time) as hour, COUNT(*) as entries
       FROM attendance_logs
       WHERE status = 'VALID' AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY HOUR(check_in_time)
       ORDER BY hour ASC`,
      [days]
    );

    // Moyenne par jour
    const [avg] = await query<any[]>(
      `SELECT ROUND(AVG(cnt), 1) as avg_daily FROM (
         SELECT DATE(check_in_time) as d, COUNT(*) as cnt
         FROM attendance_logs
         WHERE status = 'VALID' AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(check_in_time)
       ) t`,
      [days]
    );

    success(res, {
      period_days: days,
      average_daily: Number(avg?.avg_daily) || 0,
      daily,
      peak_hours: hourly,
    });
  } catch (err) {
    console.error("[ATTENDANCE] getAttendanceStats error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
