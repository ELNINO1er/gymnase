import { Request, Response } from "express";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";

// ── GET /api/dashboard/summary — Vue globale admin ─────────────

export async function getSummary(req: Request, res: Response) {
  try {
    // Membres
    const [totalMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status != 'DELETED'");
    const [activeMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status = 'ACTIVE' AND role = 'MEMBER'");
    const [pendingMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status = 'PENDING'");
    const [suspendedMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status = 'SUSPENDED'");
    const [expiredMembers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status = 'EXPIRED'");
    const [newToday] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE DATE(created_at) = CURDATE() AND status != 'DELETED'");

    // Abonnements
    const [activeSubs] = await query<any[]>("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'ACTIVE' AND end_date >= CURDATE()");
    const [expiredSubs] = await query<any[]>("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'ACTIVE' AND end_date < CURDATE()");

    // Reservations aujourd'hui
    const [todayReservations] = await query<any[]>("SELECT COUNT(*) as c FROM reservations WHERE reservation_date = CURDATE() AND status NOT IN ('CANCELLED')");
    const [todayCompleted] = await query<any[]>("SELECT COUNT(*) as c FROM reservations WHERE reservation_date = CURDATE() AND status = 'COMPLETED'");
    const [todayNoShow] = await query<any[]>("SELECT COUNT(*) as c FROM reservations WHERE reservation_date = CURDATE() AND status = 'NO_SHOW'");

    // Paiements
    const [pendingPayments] = await query<any[]>("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as c FROM payments WHERE status = 'PENDING'");
    const [todayRevenue] = await query<any[]>("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as c FROM payments WHERE DATE(paid_at) = CURDATE() AND status = 'PAID'");
    const [monthRevenue] = await query<any[]>("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as c FROM payments WHERE MONTH(paid_at) = MONTH(CURDATE()) AND YEAR(paid_at) = YEAR(CURDATE()) AND status = 'PAID'");
    const [totalRevenue] = await query<any[]>("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'PAID'");

    // Notifications non lues admin
    const adminId = req.user!.userId;
    const [unreadNotifs] = await query<any[]>("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = FALSE", [adminId]);

    success(res, {
      members: {
        total: totalMembers.c,
        active: activeMembers.c,
        pending: pendingMembers.c,
        suspended: suspendedMembers.c,
        expired: expiredMembers.c,
        new_today: newToday.c,
      },
      subscriptions: {
        active: activeSubs.c,
        expired_to_update: expiredSubs.c,
      },
      reservations_today: {
        total: todayReservations.c,
        completed: todayCompleted.c,
        no_show: todayNoShow.c,
      },
      revenue: {
        today: Number(todayRevenue.total),
        today_count: todayRevenue.c,
        month: Number(monthRevenue.total),
        month_count: monthRevenue.c,
        all_time: Number(totalRevenue.total),
        pending: Number(pendingPayments.total),
        pending_count: pendingPayments.c,
      },
      unread_notifications: unreadNotifs.c,
    });
  } catch (err) {
    console.error("[DASHBOARD] getSummary error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/dashboard/revenue/daily — 30 derniers jours ───────

export async function getDailyRevenue(req: Request, res: Response) {
  try {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));

    const revenue = await query<any[]>(
      `SELECT DATE(paid_at) as day, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM payments
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(paid_at)
       ORDER BY day ASC`,
      [days]
    );

    const [totalPeriod] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM payments
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );

    success(res, {
      period_days: days,
      total: Number(totalPeriod.total),
      count: totalPeriod.count,
      daily: revenue,
    });
  } catch (err) {
    console.error("[DASHBOARD] getDailyRevenue error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/dashboard/revenue/monthly — 12 derniers mois ──────

export async function getMonthlyRevenue(req: Request, res: Response) {
  try {
    const revenue = await query<any[]>(
      `SELECT YEAR(paid_at) as year, MONTH(paid_at) as month,
              COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM payments
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY YEAR(paid_at), MONTH(paid_at)
       ORDER BY year ASC, month ASC`
    );

    success(res, { months: revenue });
  } catch (err) {
    console.error("[DASHBOARD] getMonthlyRevenue error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/dashboard/reservations/today ───────────────────────

export async function getTodayDashboard(req: Request, res: Response) {
  try {
    const reservations = await query<any[]>(
      `SELECT r.*, s.name as session_name,
              u.full_name as user_name, u.member_code, u.phone as user_phone
       FROM reservations r
       JOIN sessions s ON s.id = r.session_id
       JOIN users u ON u.id = r.user_id
       WHERE r.reservation_date = CURDATE()
       ORDER BY r.start_time ASC`
    );

    // Par creneau
    const bySlot = await query<any[]>(
      `SELECT r.start_time, s.name as session_name, COUNT(*) as count
       FROM reservations r
       JOIN sessions s ON s.id = r.session_id
       WHERE r.reservation_date = CURDATE() AND r.status NOT IN ('CANCELLED', 'NO_SHOW')
       GROUP BY r.start_time, s.name
       ORDER BY r.start_time ASC`
    );

    success(res, {
      date: new Date().toISOString().split("T")[0],
      reservations,
      by_slot: bySlot,
      stats: {
        total: reservations.length,
        confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
        completed: reservations.filter((r) => r.status === "COMPLETED").length,
        cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
        no_show: reservations.filter((r) => r.status === "NO_SHOW").length,
      },
    });
  } catch (err) {
    console.error("[DASHBOARD] getTodayDashboard error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/dashboard/members/stats ────────────────────────────

export async function getMembersStats(req: Request, res: Response) {
  try {
    // Repartition par role
    const byRole = await query<any[]>(
      "SELECT role, COUNT(*) as count FROM users WHERE status != 'DELETED' GROUP BY role"
    );

    // Repartition par statut
    const byStatus = await query<any[]>(
      "SELECT status, COUNT(*) as count FROM users WHERE status != 'DELETED' GROUP BY status"
    );

    // Inscriptions par mois (6 derniers mois)
    const registrationTrend = await query<any[]>(
      `SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count
       FROM users
       WHERE status != 'DELETED' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY year ASC, month ASC`
    );

    // Top membres (plus de reservations)
    const topMembers = await query<any[]>(
      `SELECT u.id, u.full_name, u.member_code,
              COUNT(r.id) as reservation_count,
              COALESCE(SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) as completed_count
       FROM users u
       LEFT JOIN reservations r ON r.user_id = u.id AND r.status NOT IN ('CANCELLED')
       WHERE u.role = 'MEMBER' AND u.status = 'ACTIVE'
       GROUP BY u.id, u.full_name, u.member_code
       ORDER BY reservation_count DESC
       LIMIT 10`
    );

    success(res, {
      by_role: byRole,
      by_status: byStatus,
      registration_trend: registrationTrend,
      top_members: topMembers,
    });
  } catch (err) {
    console.error("[DASHBOARD] getMembersStats error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/dashboard/alerts — Alertes intelligentes ──────────

export async function getAlerts(req: Request, res: Response) {
  try {
    const alerts: { type: string; severity: "info" | "warning" | "danger"; title: string; message: string; count: number }[] = [];

    // 1. Abonnements qui expirent dans 3 jours
    const [expiring3d] = await query<any[]>(
      `SELECT COUNT(*) as c FROM subscriptions WHERE status = 'ACTIVE' AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`
    );
    if (expiring3d.c > 0) {
      alerts.push({ type: "expiring_soon", severity: "warning", title: "Expirations proches", message: `${expiring3d.c} abonnement(s) expirent dans les 3 prochains jours`, count: expiring3d.c });
    }

    // 2. Paiements en attente > 48h
    const [pendingOld] = await query<any[]>(
      `SELECT COUNT(*) as c FROM payments WHERE status = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)`
    );
    if (pendingOld.c > 0) {
      alerts.push({ type: "payment_overdue", severity: "danger", title: "Paiements en retard", message: `${pendingOld.c} paiement(s) en attente depuis plus de 48h`, count: pendingOld.c });
    }

    // 3. Inscriptions en attente
    const [pendingUsers] = await query<any[]>("SELECT COUNT(*) as c FROM users WHERE status = 'PENDING'");
    if (pendingUsers.c > 0) {
      alerts.push({ type: "pending_users", severity: "info", title: "Inscriptions a valider", message: `${pendingUsers.c} inscription(s) en attente de validation`, count: pendingUsers.c });
    }

    // 4. Membres inactifs (pas de visite depuis 30 jours)
    const [inactive] = await query<any[]>(
      `SELECT COUNT(*) as c FROM users u
       WHERE u.role = 'MEMBER' AND u.status = 'ACTIVE'
         AND u.id NOT IN (
           SELECT DISTINCT user_id FROM attendance_logs WHERE status = 'VALID' AND check_in_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         )`
    );
    if (inactive.c > 0) {
      alerts.push({ type: "inactive_members", severity: "warning", title: "Membres inactifs", message: `${inactive.c} membre(s) ne sont pas venus depuis 30 jours`, count: inactive.c });
    }

    // 5. Creneaux souvent complets (taux > 80% cette semaine)
    const fullSlots = await query<any[]>(
      `SELECT s.name, r.start_time, COUNT(*) as bookings, s.capacity,
              ROUND(COUNT(*) / s.capacity * 100) as fill_rate
       FROM reservations r
       JOIN sessions s ON s.id = r.session_id
       WHERE r.status NOT IN ('CANCELLED', 'NO_SHOW')
         AND r.reservation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY s.name, r.start_time, s.capacity
       HAVING fill_rate >= 80
       ORDER BY fill_rate DESC
       LIMIT 5`
    );
    if (fullSlots.length > 0) {
      alerts.push({ type: "full_slots", severity: "info", title: "Creneaux populaires", message: `${fullSlots.length} creneau(x) a plus de 80% de capacite cette semaine`, count: fullSlots.length });
    }

    // 6. Frequentation actuelle
    const [currentlyIn] = await query<any[]>(
      `SELECT COUNT(*) as c FROM attendance_logs WHERE check_out_time IS NULL AND status = 'VALID' AND DATE(check_in_time) = CURDATE()`
    );

    success(res, {
      alerts,
      currently_in_gym: currentlyIn.c,
      full_slots_detail: fullSlots,
    });
  } catch (err) {
    console.error("[DASHBOARD] getAlerts error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
