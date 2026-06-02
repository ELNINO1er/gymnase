import { query } from "../config/database.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const cronTimers: NodeJS.Timeout[] = [];

// ── Expiration des abonnements ─────────────────────────────────

export async function expireSubscriptions() {
  try {
    const expired = await query<any[]>(
      `SELECT s.id, s.user_id, u.full_name, mp.name as plan_name
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.status = 'ACTIVE' AND s.end_date < CURDATE()`
    );

    if (expired.length === 0) return { expired_count: 0 };

    await query<any>("UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURDATE()");

    await query<any>(
      `UPDATE users SET status = 'EXPIRED'
       WHERE role = 'MEMBER' AND status = 'ACTIVE'
         AND id NOT IN (SELECT user_id FROM subscriptions WHERE status = 'ACTIVE' AND end_date >= CURDATE())
         AND id IN (SELECT user_id FROM subscriptions WHERE status = 'EXPIRED')`
    );

    for (const sub of expired) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Abonnement expire', ?, 'SUBSCRIPTION')`,
        [sub.user_id, `Votre abonnement "${sub.plan_name}" a expire. Renouvelez-le pour continuer.`]
      );
    }

    const admins = await query<any[]>("SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'");
    for (const admin of admins) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Abonnements expires', ?, 'SYSTEM')`,
        [admin.id, `${expired.length} abonnement(s) expire(s) : ${expired.map((e) => e.full_name).join(", ")}`]
      );
    }

    console.log(`[CRON] ${expired.length} abonnement(s) expire(s)`);
    return { expired_count: expired.length };
  } catch (err) {
    console.error("[CRON] expireSubscriptions error:", err);
    return { expired_count: 0 };
  }
}

async function runDailyTasks() {
  await expireSubscriptions();
  await remindExpiringSubscriptions();
  await remindPendingPayments();
  await alertInactiveMembers();
  await autoGenerateInvoices();
  await awardMemberOfTheMonth();
}

// ── Rappel abonnement expire dans 3 jours ──────────────────────

async function remindExpiringSubscriptions() {
  try {
    const expiringSoon = await query<any[]>(
      `SELECT s.id, s.user_id, s.end_date, u.full_name, mp.name as plan_name
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.status = 'ACTIVE' AND s.end_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)`
    );

    for (const sub of expiringSoon) {
      // Eviter les doublons de notification
      const [existing] = await query<any[]>(
        `SELECT id FROM notifications WHERE user_id = ? AND title = 'Abonnement bientot expire' AND DATE(created_at) = CURDATE()`,
        [sub.user_id]
      );
      if (existing) continue;

      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Abonnement bientot expire', ?, 'SUBSCRIPTION')`,
        [sub.user_id, `Votre abonnement "${sub.plan_name}" expire dans 3 jours (${new Date(sub.end_date).toLocaleDateString("fr-FR")}). Pensez a le renouveler.`]
      );
    }

    if (expiringSoon.length > 0) console.log(`[CRON] ${expiringSoon.length} rappel(s) d'expiration envoye(s)`);
  } catch (err) {
    console.error("[CRON] remindExpiringSubscriptions error:", err);
  }
}

// ── Rappel paiements en attente > 48h ──────────────────────────

async function remindPendingPayments() {
  try {
    const pending = await query<any[]>(
      `SELECT p.id, p.user_id, p.amount, u.full_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.status = 'PENDING' AND p.created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)`
    );

    // Notifier l'admin une fois par jour
    if (pending.length === 0) return;

    const admins = await query<any[]>("SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'");

    for (const admin of admins) {
      const [existing] = await query<any[]>(
        `SELECT id FROM notifications WHERE user_id = ? AND title = 'Paiements en retard' AND DATE(created_at) = CURDATE()`,
        [admin.id]
      );
      if (existing) continue;

      const totalAmount = pending.reduce((s, p) => s + Number(p.amount), 0);
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Paiements en retard', ?, 'PAYMENT')`,
        [admin.id, `${pending.length} paiement(s) en attente depuis plus de 48h (total: ${totalAmount.toLocaleString()} FCFA). Membres: ${pending.map((p) => p.full_name).join(", ")}`]
      );
    }

    console.log(`[CRON] ${pending.length} paiement(s) en retard signale(s)`);
  } catch (err) {
    console.error("[CRON] remindPendingPayments error:", err);
  }
}

// ── Alerte membres inactifs (pas venus depuis 30 jours) ────────

async function alertInactiveMembers() {
  try {
    const inactive = await query<any[]>(
      `SELECT u.id, u.full_name, u.member_code,
              MAX(a.check_in_time) as last_visit
       FROM users u
       LEFT JOIN attendance_logs a ON a.user_id = u.id AND a.status = 'VALID'
       WHERE u.role = 'MEMBER' AND u.status = 'ACTIVE'
       GROUP BY u.id, u.full_name, u.member_code
       HAVING last_visit IS NULL OR last_visit < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    if (inactive.length === 0) return;

    // Alerte admin hebdomadaire (le lundi)
    const today = new Date();
    if (today.getDay() !== 1) return; // Seulement le lundi

    const admins = await query<any[]>("SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'");
    for (const admin of admins) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Membres inactifs', ?, 'SYSTEM')`,
        [admin.id, `${inactive.length} membre(s) ne sont pas venus depuis plus de 30 jours : ${inactive.slice(0, 5).map((m) => m.full_name).join(", ")}${inactive.length > 5 ? "..." : ""}`]
      );
    }

    console.log(`[CRON] ${inactive.length} membre(s) inactif(s) detecte(s)`);
  } catch (err) {
    console.error("[CRON] alertInactiveMembers error:", err);
  }
}

// ── Auto-generation de factures pour paiements valides ────────

async function autoGenerateInvoices() {
  try {
    // Trouver les paiements PAID sans facture
    const payments = await query<any[]>(
      `SELECT p.id, p.user_id, p.amount, u.full_name, mp.name as plan_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN membership_plans mp ON mp.id = s.plan_id
       LEFT JOIN invoices i ON i.payment_id = p.id
       WHERE p.status = 'PAID' AND i.id IS NULL`
    );

    for (const p of payments) {
      const y = new Date().getFullYear();
      const m = String(new Date().getMonth() + 1).padStart(2, "0");
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const invoiceNumber = `INV-${y}${m}-${rand}`;
      const label = p.plan_name ? `Abonnement ${p.plan_name}` : "Paiement";

      await query<any>(
        `INSERT INTO invoices (user_id, payment_id, invoice_number, label, amount, status, paid_at)
         VALUES (?, ?, ?, ?, ?, 'PAID', NOW())`,
        [p.user_id, p.id, invoiceNumber, label, p.amount]
      );
    }

    if (payments.length > 0) console.log(`[CRON] ${payments.length} facture(s) auto-generee(s)`);
  } catch (err) {
    console.error("[CRON] autoGenerateInvoices error:", err);
  }
}

// ── Badge "Membre du mois" auto-attribution ─────────────────

async function awardMemberOfTheMonth() {
  try {
    // Run on the 1st of each month only
    const today = new Date();
    if (today.getDate() !== 1) return;

    const gyms = await query<any[]>(
      "SELECT id, name FROM gyms WHERE status = 'ACTIVE'"
    );

    for (const gym of gyms) {
      // Find the MANUAL badge named "Membre du mois" for this gym
      const [badge] = await query<any[]>(
        "SELECT id FROM badges WHERE gym_id = ? AND criteria_type = 'MANUAL' AND name LIKE '%membre du mois%' LIMIT 1",
        [gym.id]
      );
      if (!badge) continue;

      // Find the member with the most completed sessions last month for this gym
      const topMember = await query<any[]>(
        `SELECT r.user_id, u.full_name, COUNT(*) as completed
         FROM reservations r
         JOIN users u ON u.id = r.user_id
         WHERE r.gym_id = ?
           AND r.status = 'COMPLETED'
           AND MONTH(r.reservation_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND YEAR(r.reservation_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND u.role = 'MEMBER' AND u.status = 'ACTIVE'
         GROUP BY r.user_id, u.full_name
         ORDER BY completed DESC
         LIMIT 1`,
        [gym.id]
      );

      if (topMember.length === 0) continue;

      const winner = topMember[0];

      // Check if already awarded this month
      const [existing] = await query<any[]>(
        `SELECT id FROM user_badges
         WHERE user_id = ? AND badge_id = ?
           AND MONTH(earned_at) = MONTH(CURDATE()) AND YEAR(earned_at) = YEAR(CURDATE())`,
        [winner.user_id, badge.id]
      );
      if (existing) continue;

      // Award the badge
      await query<any>(
        "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
        [winner.user_id, badge.id]
      );

      // Notify the winner
      await query<any>(
        `INSERT INTO notifications (gym_id, user_id, title, message, type)
         VALUES (?, ?, 'Membre du mois !', ?, 'INFO')`,
        [gym.id, winner.user_id, `Felicitations ${winner.full_name} ! Vous etes le membre du mois avec ${winner.completed} seance(s) completee(s) !`]
      );

      // Notify admins for this gym
      const admins = await query<any[]>(
        "SELECT id FROM users WHERE gym_id = ? AND role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'",
        [gym.id]
      );
      for (const admin of admins) {
        await query<any>(
          `INSERT INTO notifications (gym_id, user_id, title, message, type)
           VALUES (?, ?, 'Membre du mois attribue', ?, 'SYSTEM')`,
          [gym.id, admin.id, `${winner.full_name} a ete nomme membre du mois (${winner.completed} seances).`]
        );
      }

      console.log(`[CRON] Membre du mois ${gym.name}: ${winner.full_name} (${winner.completed} seances)`);
    }
  } catch (err) {
    console.error("[CRON] awardMemberOfTheMonth error:", err);
  }
}

// ── Demarrage ──────────────────────────────────────────────────

export function startCronJobs() {
  console.log("[CRON] Lancement des taches automatiques...");

  if (cronTimers.length > 0) {
    console.log("[CRON] Taches automatiques deja demarrees");
    return;
  }

  runDailyTasks().catch((err) => console.error("[CRON] daily tasks error:", err));

  cronTimers.push(setInterval(() => {
    runDailyTasks().catch((err) => console.error("[CRON] daily tasks error:", err));
  }, DAY_MS));

  console.log("[CRON] Taches automatiques demarrees (6 jobs, intervalle: 24h)");
}

export function stopCronJobs() {
  while (cronTimers.length > 0) {
    const timer = cronTimers.pop();
    if (timer) clearInterval(timer);
  }
  console.log("[CRON] Taches automatiques arretees");
}
