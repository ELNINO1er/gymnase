import { query } from "../config/database.js";

interface RiskFactors {
  days_since_last_visit: number | null;
  subscription_days_left: number | null;
  pending_payments: number;
  cancellation_rate: number;
  total_sessions_30d: number;
}

/**
 * Calcule le score de risque d'abandon pour un membre.
 * Score 0-100 : 0 = aucun risque, 100 = risque maximum.
 */
export async function calculateRiskScore(userId: number, gymId?: number): Promise<{ score: number; level: "LOW" | "MEDIUM" | "HIGH"; factors: RiskFactors }> {
  let score = 0;
  const gymFilter = gymId ? " AND gym_id = ?" : "";
  const gymParams = gymId ? [gymId] : [];

  // 1. Derniere visite
  const [lastVisit] = await query<any[]>(
    `SELECT MAX(check_in_time) as last FROM attendance_logs WHERE user_id = ?${gymFilter} AND status = 'VALID'`,
    [userId, ...gymParams]
  );
  const daysSinceVisit = lastVisit?.last
    ? Math.floor((Date.now() - new Date(lastVisit.last).getTime()) / 86400000)
    : null;

  if (daysSinceVisit === null) score += 25;       // Jamais venu
  else if (daysSinceVisit > 30) score += 30;       // Absent > 30 jours
  else if (daysSinceVisit > 14) score += 15;       // Absent > 14 jours
  else if (daysSinceVisit > 7) score += 5;         // Absent > 7 jours

  // 2. Abonnement
  const [sub] = await query<any[]>(
    `SELECT end_date FROM subscriptions WHERE user_id = ?${gymFilter} AND status = 'ACTIVE' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1`,
    [userId, ...gymParams]
  );
  const daysLeft = sub ? Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : null;

  if (daysLeft === null) score += 20;              // Pas d'abo actif
  else if (daysLeft <= 3) score += 15;             // Expire dans 3 jours
  else if (daysLeft <= 7) score += 10;             // Expire dans 7 jours

  // 3. Paiements en retard
  const [pendingPay] = await query<any[]>(
    `SELECT COUNT(*) as c FROM payments WHERE user_id = ?${gymFilter} AND status = 'PENDING'`,
    [userId, ...gymParams]
  );
  const pendingPayments = pendingPay.c;
  if (pendingPayments >= 2) score += 20;
  else if (pendingPayments === 1) score += 10;

  // 4. Taux d'annulation (sur les 30 derniers jours)
  const [resvStats] = await query<any[]>(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
     FROM reservations WHERE user_id = ?${gymFilter} AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [userId, ...gymParams]
  );
  const cancellationRate = resvStats.total > 0 ? resvStats.cancelled / resvStats.total : 0;
  if (cancellationRate > 0.5) score += 15;
  else if (cancellationRate > 0.3) score += 5;

  // 5. Sessions completees dans les 30 derniers jours
  const [sessions30d] = await query<any[]>(
    `SELECT COUNT(*) as c FROM reservations WHERE user_id = ?${gymFilter} AND status = 'COMPLETED' AND reservation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
    [userId, ...gymParams]
  );
  const totalSessions = sessions30d.c;
  if (totalSessions === 0) score += 10;

  // Cap a 100
  score = Math.min(100, score);

  const level: "LOW" | "MEDIUM" | "HIGH" = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";

  const factors: RiskFactors = {
    days_since_last_visit: daysSinceVisit,
    subscription_days_left: daysLeft,
    pending_payments: pendingPayments,
    cancellation_rate: Math.round(cancellationRate * 100),
    total_sessions_30d: totalSessions,
  };

  // Sauvegarder
  await query<any>(
    `INSERT INTO member_risk_scores (user_id, score, risk_level, factors, calculated_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE score = ?, risk_level = ?, factors = ?, calculated_at = NOW()`,
    [userId, score, level, JSON.stringify(factors), score, level, JSON.stringify(factors)]
  );

  return { score, level, factors };
}

/**
 * Recalcule le score pour tous les membres actifs.
 */
export async function recalculateAllRiskScores(gymId?: number): Promise<number> {
  const members = await query<any[]>(
    `SELECT id FROM users WHERE role = 'MEMBER' AND status IN ('ACTIVE', 'EXPIRED')${gymId ? " AND gym_id = ?" : ""}`,
    gymId ? [gymId] : []
  );

  for (const member of members) {
    await calculateRiskScore(member.id, gymId);
  }

  console.log(`[RISK] ${members.length} score(s) recalcule(s)`);
  return members.length;
}
