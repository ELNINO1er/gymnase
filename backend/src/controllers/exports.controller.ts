import { Request, Response } from "express";
import { query } from "../config/database.js";
import { error, ErrorCode } from "../utils/response.js";

function toCsv(headers: string[], rows: any[]): string {
  const lines = [headers.join(";")];
  for (const row of rows) {
    lines.push(headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(";") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    }).join(";"));
  }
  return "\uFEFF" + lines.join("\n"); // BOM pour Excel
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

// GET /api/exports/members
export async function exportMembers(req: Request, res: Response) {
  try {
    const rows = await query<any[]>(
      `SELECT full_name, email, phone, role, status, member_code, sport_goal, created_at
       FROM users WHERE status != 'DELETED' ORDER BY full_name`
    );
    const csv = toCsv(["full_name", "email", "phone", "role", "status", "member_code", "sport_goal", "created_at"], rows);
    sendCsv(res, `membres_${new Date().toISOString().split("T")[0]}.csv`, csv);
  } catch (err) {
    console.error("[EXPORTS] exportMembers error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/exports/payments
export async function exportPayments(req: Request, res: Response) {
  try {
    const dateFrom = req.query.date_from as string || "";
    const dateTo = req.query.date_to as string || "";

    let where = "WHERE 1=1";
    const params: any[] = [];
    if (dateFrom) { where += " AND DATE(p.created_at) >= ?"; params.push(dateFrom); }
    if (dateTo) { where += " AND DATE(p.created_at) <= ?"; params.push(dateTo); }

    const rows = await query<any[]>(
      `SELECT p.id, u.full_name, u.member_code, p.amount, p.payment_method, p.status, p.transaction_reference, p.paid_at, p.created_at
       FROM payments p JOIN users u ON u.id = p.user_id ${where} ORDER BY p.created_at DESC`,
      params
    );
    const csv = toCsv(["id", "full_name", "member_code", "amount", "payment_method", "status", "transaction_reference", "paid_at", "created_at"], rows);
    sendCsv(res, `paiements_${new Date().toISOString().split("T")[0]}.csv`, csv);
  } catch (err) {
    console.error("[EXPORTS] exportPayments error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/exports/reservations
export async function exportReservations(req: Request, res: Response) {
  try {
    const rows = await query<any[]>(
      `SELECT r.id, u.full_name, u.member_code, s.name as session_name, r.reservation_date, r.start_time, r.end_time, r.status, r.created_at
       FROM reservations r
       JOIN users u ON u.id = r.user_id
       JOIN sessions s ON s.id = r.session_id
       ORDER BY r.reservation_date DESC`
    );
    const csv = toCsv(["id", "full_name", "member_code", "session_name", "reservation_date", "start_time", "end_time", "status", "created_at"], rows);
    sendCsv(res, `reservations_${new Date().toISOString().split("T")[0]}.csv`, csv);
  } catch (err) {
    console.error("[EXPORTS] exportReservations error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/exports/attendance
export async function exportAttendance(req: Request, res: Response) {
  try {
    const rows = await query<any[]>(
      `SELECT a.id, u.full_name, u.member_code, a.check_in_time, a.check_out_time, a.method, a.status, a.reason
       FROM attendance_logs a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.check_in_time DESC`
    );
    const csv = toCsv(["id", "full_name", "member_code", "check_in_time", "check_out_time", "method", "status", "reason"], rows);
    sendCsv(res, `presences_${new Date().toISOString().split("T")[0]}.csv`, csv);
  } catch (err) {
    console.error("[EXPORTS] exportAttendance error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
