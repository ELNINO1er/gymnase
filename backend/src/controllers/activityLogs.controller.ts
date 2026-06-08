import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, paginated } from "../utils/response.js";
import { requireGymContext } from "../utils/access.js";

// ── GET /api/logs — Liste paginee des logs d'activite ──────────

export async function getLogs(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = (page - 1) * limit;
    const action = req.query.action as string || "";
    const targetType = req.query.target_type as string || "";
    const adminId = req.query.admin_id as string || "";
    const dateFrom = req.query.date_from as string || "";
    const dateTo = req.query.date_to as string || "";
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    let where = "WHERE gym_id = ?";
    const params: any[] = [gymId];

    if (action) { where += " AND action = ?"; params.push(action); }
    if (targetType) { where += " AND target_type = ?"; params.push(targetType); }
    if (adminId) { where += " AND admin_id = ?"; params.push(adminId); }
    if (dateFrom) { where += " AND DATE(created_at) >= ?"; params.push(dateFrom); }
    if (dateTo) { where += " AND DATE(created_at) <= ?"; params.push(dateTo); }

    const [countResult] = await query<any[]>(`SELECT COUNT(*) as total FROM activity_logs ${where}`, params);

    const logs = await query<any[]>(
      `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    paginated(res, logs, countResult.total, page, limit);
  } catch (err) {
    console.error("[LOGS] getLogs error:", err);
    error(res, "Erreur serveur", 500);
  }
}
