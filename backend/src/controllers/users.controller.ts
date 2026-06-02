import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, paginated, ErrorCode } from "../utils/response.js";
import { generateMemberCode } from "../utils/token.js";
import { logActivity } from "../services/activityLog.js";
import { requireGymContext } from "../utils/access.js";

// ── Schemas ────────────────────────────────────────────────────

const createUserSchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().email().max(150).optional().nullable(),
  phone: z.string().min(8).max(30),
  password: z.string().min(6).max(100),
  role: z.enum(["VISITOR", "MEMBER", "COACH", "ADMIN"]).default("MEMBER"),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  sport_goal: z.string().max(255).optional().nullable(),
});

const updateUserSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  email: z.string().email().max(150).optional().nullable(),
  phone: z.string().min(8).max(30).optional(),
  role: z.enum(["VISITOR", "MEMBER", "COACH", "ADMIN"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "EXPIRED", "DELETED"]).optional(),
  sport_goal: z.string().max(255).optional().nullable(),
});

// ── GET /api/users — Liste paginee + recherche ─────────────────

export async function getUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const keyword = (req.query.keyword as string || "").trim();
    const role = req.query.role as string || "";
    const status = req.query.status as string || "";
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    let where = "WHERE gym_id = ? AND status != 'DELETED'";
    const params: any[] = [gymId];

    if (keyword) {
      where += " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR member_code LIKE ?)";
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    if (role) {
      where += " AND role = ?";
      params.push(role);
    }

    if (status) {
      where += " AND status = ?";
      params.push(status);
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const total = countResult[0].total;

    const users = await query<any[]>(
      `SELECT id, gym_id, full_name, email, phone, role, status, member_code, sport_goal, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    paginated(res, users, total, page, limit);
  } catch (err) {
    console.error("[USERS] getUsers error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/users/:id — Detail d'un utilisateur ───────────────

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const users = await query<any[]>(
      `SELECT id, gym_id, full_name, email, phone, role, status, member_code, sport_goal, created_at, updated_at
       FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'`,
      [id, gymId]
    );

    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    const user = users[0];

    // Abonnement actif
    const subs = await query<any[]>(
      `SELECT s.id, s.start_date, s.end_date, s.status, mp.name as plan_name, mp.price as plan_price, mp.duration_days
       FROM subscriptions s
       JOIN membership_plans mp ON mp.id = s.plan_id
       WHERE s.user_id = ? AND s.gym_id = ?
       ORDER BY s.created_at DESC`,
      [id, gymId]
    );

    // Reservations recentes
    const reservations = await query<any[]>(
      `SELECT r.id, r.reservation_date, r.start_time, r.end_time, r.status, se.name as session_name
       FROM reservations r
       JOIN sessions se ON se.id = r.session_id
       WHERE r.user_id = ? AND r.gym_id = ?
       ORDER BY r.reservation_date DESC, r.start_time DESC
       LIMIT 10`,
      [id, gymId]
    );

    // Paiements recents
    const payments = await query<any[]>(
      `SELECT id, amount, payment_method, status, transaction_reference, paid_at, created_at
       FROM payments WHERE user_id = ? AND gym_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [id, gymId]
    );

    // Stats
    const [payStats] = await query<any[]>(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE user_id = ? AND gym_id = ? AND status = 'PAID'",
      [id, gymId]
    );
    const [resvStats] = await query<any[]>(
      "SELECT COUNT(*) as total FROM reservations WHERE user_id = ? AND gym_id = ? AND status NOT IN ('CANCELLED')",
      [id, gymId]
    );

    success(res, {
      ...user,
      subscriptions: subs,
      recent_reservations: reservations,
      recent_payments: payments,
      stats: {
        total_paid: payStats?.total_paid || 0,
        total_reservations: resvStats?.total || 0,
      },
    });
  } catch (err) {
    console.error("[USERS] getUserById error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── POST /api/users — Creer un utilisateur (admin) ─────────────

export async function createUser(req: Request, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { full_name, email, phone, password, role, status, sport_goal } = parsed.data;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    // Verification doublons
    const existing = await query<any[]>(
      "SELECT id FROM users WHERE gym_id = ? AND (email = ? OR phone = ?)",
      [gymId, email || "_no_email_", phone]
    );

    if (existing.length > 0) {
      error(res, "Un compte existe deja avec cet email ou ce telephone", 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const memberCode = generateMemberCode();

    const result = await query<any>(
      `INSERT INTO users (gym_id, full_name, email, phone, password_hash, role, status, member_code, sport_goal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [gymId, full_name, email || null, phone, passwordHash, role, status, memberCode, sport_goal || null]
    );

    await logActivity(req, { action: "CREATE", targetType: "USER", targetId: result.insertId, description: `Membre cree : ${full_name} (${role})` });

    success(res, {
      id: result.insertId,
      gym_id: gymId,
      full_name,
      email,
      phone,
      role,
      status,
      member_code: memberCode,
    }, 201, "Utilisateur cree");
  } catch (err) {
    console.error("[USERS] createUser error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── PUT /api/users/:id — Modifier un utilisateur ───────────────

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    // Verifier que l'utilisateur existe
    const existing = await query<any[]>("SELECT id, role FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'", [id, gymId]);
    if (existing.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) { fields.push("full_name = ?"); values.push(data.full_name); }
    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
    if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone); }
    if (data.role !== undefined) { fields.push("role = ?"); values.push(data.role); }
    if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
    if (data.sport_goal !== undefined) { fields.push("sport_goal = ?"); values.push(data.sport_goal); }

    if (fields.length === 0) {
      error(res, "Aucune donnee a modifier");
      return;
    }

    // Verifier doublons email/phone
    if (data.email || data.phone) {
      const conditions: string[] = [];
      const dupValues: any[] = [];
      if (data.email) { conditions.push("email = ?"); dupValues.push(data.email); }
      if (data.phone) { conditions.push("phone = ?"); dupValues.push(data.phone); }

      const dups = await query<any[]>(
        `SELECT id FROM users WHERE gym_id = ? AND (${conditions.join(" OR ")}) AND id != ?`,
        [gymId, ...dupValues, id]
      );
      if (dups.length > 0) {
        error(res, "Cet email ou ce telephone est deja utilise", 409);
        return;
      }
    }

    values.push(id);
    values.push(gymId);
    await query<any>(`UPDATE users SET ${fields.join(", ")} WHERE id = ? AND gym_id = ?`, values);

    // Retourner l'utilisateur mis a jour
    const updated = await query<any[]>(
      "SELECT id, gym_id, full_name, email, phone, role, status, member_code, sport_goal, created_at, updated_at FROM users WHERE id = ? AND gym_id = ?",
      [id, gymId]
    );

    success(res, updated[0]);
  } catch (err) {
    console.error("[USERS] updateUser error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── DELETE /api/users/:id — Soft delete ────────────────────────

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const existing = await query<any[]>("SELECT id, role FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'", [id, gymId]);
    if (existing.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    // Empecher la suppression d'un SUPER_ADMIN
    if (existing[0].role === "SUPER_ADMIN") {
      error(res, "Impossible de supprimer un super administrateur", 403);
      return;
    }

    await query<any>("UPDATE users SET status = 'DELETED' WHERE id = ? AND gym_id = ?", [id, gymId]);

    // Annuler abonnements et reservations actifs
    await query<any>(
      "UPDATE subscriptions SET status = 'CANCELLED' WHERE user_id = ? AND status IN ('PENDING', 'ACTIVE')",
      [id]
    );
    await query<any>(
      "UPDATE reservations SET status = 'CANCELLED' WHERE user_id = ? AND status IN ('PENDING', 'CONFIRMED')",
      [id]
    );

    await logActivity(req, { action: "DELETE", targetType: "USER", targetId: Number(id), description: `Membre supprime : #${id}` });

    success(res, { message: "Utilisateur supprime" });
  } catch (err) {
    console.error("[USERS] deleteUser error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── PUT /api/users/:id/validate — Valider inscription ──────────

export async function validateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const users = await query<any[]>(
      "SELECT id, full_name, status, role FROM users WHERE id = ? AND gym_id = ?",
      [id, gymId]
    );

    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    const user = users[0];

    if (user.status !== "PENDING") {
      error(res, `Impossible de valider : statut actuel = ${user.status}`);
      return;
    }

    // Passer en ACTIVE + role MEMBER
    await query<any>(
      "UPDATE users SET status = 'ACTIVE', role = 'MEMBER' WHERE id = ?",
      [id]
    );

    // Activer souscription PENDING si elle existe
    await query<any>(
      "UPDATE subscriptions SET status = 'ACTIVE' WHERE user_id = ? AND status = 'PENDING'",
      [id]
    );

    // Notification au membre
    await query<any>(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Inscription validee', 'Votre inscription a ete validee. Bienvenue chez Elite Gym !', 'SUBSCRIPTION')`,
      [id]
    );

    await logActivity(req, { action: "VALIDATE", targetType: "USER", targetId: Number(id), description: `Inscription validee : ${user.full_name}` });

    success(res, {
      message: `${user.full_name} est maintenant membre actif.`,
      user_id: user.id,
      new_status: "ACTIVE",
      new_role: "MEMBER",
    });
  } catch (err) {
    console.error("[USERS] validateUser error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── PUT /api/users/:id/suspend — Suspendre un membre ───────────

export async function suspendUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const users = await query<any[]>("SELECT id, full_name, status FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'", [id, gymId]);
    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    await query<any>("UPDATE users SET status = 'SUSPENDED' WHERE id = ? AND gym_id = ?", [id, gymId]);

    // Notification
    await query<any>(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Compte suspendu', 'Votre compte a ete suspendu. Contactez l administration pour plus d informations.', 'SYSTEM')`,
      [id]
    );

    await logActivity(req, { action: "SUSPEND", targetType: "USER", targetId: Number(id), description: `Membre suspendu : ${users[0].full_name}` });

    success(res, { message: `${users[0].full_name} a ete suspendu.` });
  } catch (err) {
    console.error("[USERS] suspendUser error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── PUT /api/users/:id/reactivate — Reactiver un membre ────────

export async function reactivateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const users = await query<any[]>("SELECT id, full_name, status FROM users WHERE id = ? AND gym_id = ?", [id, gymId]);
    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    if (!["SUSPENDED", "EXPIRED"].includes(users[0].status)) {
      error(res, `Impossible de reactiver : statut actuel = ${users[0].status}`);
      return;
    }

    await query<any>("UPDATE users SET status = 'ACTIVE' WHERE id = ? AND gym_id = ?", [id, gymId]);

    await query<any>(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Compte reactive', 'Votre compte a ete reactive. Bon entrainement !', 'SYSTEM')`,
      [id]
    );

    await logActivity(req, { action: "REACTIVATE", targetType: "USER", targetId: Number(id), description: `Membre reactive : ${users[0].full_name}` });

    success(res, { message: `${users[0].full_name} a ete reactive.` });
  } catch (err) {
    console.error("[USERS] reactivateUser error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// ── GET /api/users/search — Recherche rapide ───────────────────

export async function searchUsers(req: Request, res: Response) {
  try {
    const keyword = (req.query.keyword as string || "").trim();
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    if (!keyword || keyword.length < 2) {
      error(res, "Mot-cle de recherche requis (min 2 caracteres)");
      return;
    }

    const kw = `%${keyword}%`;
    const users = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, member_code
       FROM users
       WHERE gym_id = ?
         AND status != 'DELETED'
         AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR member_code LIKE ?)
       ORDER BY full_name ASC
       LIMIT 20`,
      [gymId, kw, kw, kw, kw]
    );

    success(res, users);
  } catch (err) {
    console.error("[USERS] searchUsers error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/users/stats — Stats membres (admin) ───────────────

export async function getUserStats(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;
    const [total] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND status != 'DELETED'", [gymId]);
    const [active] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND status = 'ACTIVE'", [gymId]);
    const [pending] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND status = 'PENDING'", [gymId]);
    const [suspended] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND status = 'SUSPENDED'", [gymId]);
    const [expired] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND status = 'EXPIRED'", [gymId]);
    const [members] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND role = 'MEMBER' AND status = 'ACTIVE'", [gymId]);
    const [visitors] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND role = 'VISITOR'", [gymId]);

    const [newToday] = await query<any[]>(
      "SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND DATE(created_at) = CURDATE() AND status != 'DELETED'",
      [gymId]
    );
    const [newThisWeek] = await query<any[]>(
      "SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'DELETED'",
      [gymId]
    );
    const [newThisMonth] = await query<any[]>(
      "SELECT COUNT(*) as count FROM users WHERE gym_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status != 'DELETED'",
      [gymId]
    );

    success(res, {
      total: total.count,
      active: active.count,
      pending: pending.count,
      suspended: suspended.count,
      expired: expired.count,
      members: members.count,
      visitors: visitors.count,
      new_today: newToday.count,
      new_this_week: newThisWeek.count,
      new_this_month: newThisMonth.count,
    });
  } catch (err) {
    console.error("[USERS] getUserStats error:", err);
    error(res, "Erreur serveur", 500);
  }
}
