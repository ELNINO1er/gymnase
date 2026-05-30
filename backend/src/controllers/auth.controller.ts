import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/database.js";
import { generateToken, generateMemberCode } from "../utils/token.js";
import { success, error } from "../utils/response.js";

// ── Schemas de validation ──────────────────────────────────────

const registerSchema = z.object({
  full_name: z.string().min(2, "Nom requis (min 2 caracteres)").max(150),
  email: z.string().email("Email invalide").max(150).optional().nullable(),
  phone: z.string().min(8, "Telephone requis (min 8 chiffres)").max(30),
  password: z.string().min(6, "Mot de passe requis (min 6 caracteres)").max(100),
  sport_goal: z.string().max(255).optional().nullable(),
  plan_id: z.number().int().positive().optional().nullable(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Email, telephone ou code membre requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Mot de passe actuel requis"),
  new_password: z.string().min(6, "Nouveau mot de passe requis (min 6 caracteres)").max(100),
});

const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  email: z.string().email("Email invalide").max(150).optional().nullable(),
  phone: z.string().min(8).max(30).optional(),
  sport_goal: z.string().max(255).optional().nullable(),
});

// ── Register ───────────────────────────────────────────────────

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { full_name, email, phone, password, sport_goal, plan_id } = parsed.data;

    // Verification doublons
    const existing = await query<any[]>(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email || "_no_email_", phone]
    );

    if (existing.length > 0) {
      error(res, "Un compte existe deja avec cet email ou ce telephone", 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const memberCode = generateMemberCode();

    // Creer l'utilisateur avec statut PENDING
    const result = await query<any>(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, member_code, sport_goal)
       VALUES (?, ?, ?, ?, 'VISITOR', 'PENDING', ?, ?)`,
      [full_name, email || null, phone, passwordHash, memberCode, sport_goal || null]
    );

    const userId = result.insertId;

    // Si un plan est choisi, creer la souscription + paiement en attente
    if (plan_id) {
      const plans = await query<any[]>("SELECT * FROM membership_plans WHERE id = ? AND is_active = TRUE", [plan_id]);

      if (plans.length > 0) {
        const plan = plans[0];
        const startDate = new Date().toISOString().split("T")[0];
        const endDate = new Date(Date.now() + plan.duration_days * 86400000).toISOString().split("T")[0];

        // Creer souscription PENDING
        const subResult = await query<any>(
          `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
           VALUES (?, ?, ?, ?, 'PENDING')`,
          [userId, plan_id, startDate, endDate]
        );

        // Creer paiement PENDING
        await query<any>(
          `INSERT INTO payments (user_id, subscription_id, amount, payment_method, status)
           VALUES (?, ?, ?, 'CASH', 'PENDING')`,
          [userId, subResult.insertId, plan.price]
        );
      }
    }

    // Notification pour l'admin
    const admins = await query<any[]>("SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'");
    for (const admin of admins) {
      await query<any>(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'SUBSCRIPTION')`,
        [admin.id, "Nouvelle inscription", `${full_name} vient de s'inscrire et attend votre validation.`]
      );
    }

    success(res, {
      message: "Inscription enregistree. En attente de validation par l'administration.",
      member_code: memberCode,
      user_id: userId,
    }, 201);
  } catch (err) {
    console.error("[AUTH] Register error:", err);
    error(res, "Erreur lors de l'inscription", 500);
  }
}

// ── Login ──────────────────────────────────────────────────────

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors[0].message);
      return;
    }

    const { identifier, password } = parsed.data;

    const users = await query<any[]>(
      "SELECT * FROM users WHERE (email = ? OR phone = ? OR member_code = ?) AND status != 'DELETED'",
      [identifier, identifier, identifier]
    );

    if (users.length === 0) {
      error(res, "Identifiants incorrects", 401);
      return;
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      error(res, "Identifiants incorrects", 401);
      return;
    }

    if (user.status === "SUSPENDED") {
      error(res, "Votre compte est suspendu. Contactez l'administration.", 403);
      return;
    }

    if (user.status === "PENDING" && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      error(res, "Votre inscription est en attente de validation.", 403);
      return;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    // Charger abonnement actif si membre
    let activeSubscription = null;
    if (["MEMBER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      const subs = await query<any[]>(
        `SELECT s.*, mp.name as plan_name, mp.price as plan_price
         FROM subscriptions s
         JOIN membership_plans mp ON mp.id = s.plan_id
         WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
         ORDER BY s.end_date DESC LIMIT 1`,
        [user.id]
      );
      activeSubscription = subs[0] || null;
    }

    success(res, {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        member_code: user.member_code,
        sport_goal: user.sport_goal,
        created_at: user.created_at,
      },
      subscription: activeSubscription,
    });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    error(res, "Erreur lors de la connexion", 500);
  }
}

// ── Me (profil connecte) ───────────────────────────────────────

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      error(res, "Non authentifie", 401);
      return;
    }

    const users = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, member_code, sport_goal, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.userId]
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
       WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC LIMIT 1`,
      [user.id]
    );

    // Statistiques rapides
    const [resvStats] = await query<any[]>(
      `SELECT COUNT(*) as total FROM reservations WHERE user_id = ? AND status NOT IN ('CANCELLED')`,
      [user.id]
    );
    const [payStats] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE user_id = ? AND status = 'PAID'`,
      [user.id]
    );

    // Notifications non lues
    const [notifStats] = await query<any[]>(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [user.id]
    );

    success(res, {
      ...user,
      subscription: subs[0] || null,
      stats: {
        total_reservations: resvStats?.total || 0,
        total_paid: payStats?.total_paid || 0,
        unread_notifications: notifStats?.unread || 0,
      },
    });
  } catch (err) {
    console.error("[AUTH] Me error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── Logout ─────────────────────────────────────────────────────

export async function logout(_req: Request, res: Response) {
  success(res, { message: "Deconnexion reussie" });
}

// ── Change password ────────────────────────────────────────────

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      error(res, "Non authentifie", 401);
      return;
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors[0].message);
      return;
    }

    const { current_password, new_password } = parsed.data;

    const users = await query<any[]>("SELECT password_hash FROM users WHERE id = ?", [req.user.userId]);
    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    const valid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!valid) {
      error(res, "Mot de passe actuel incorrect", 401);
      return;
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query<any>("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.userId]);

    success(res, { message: "Mot de passe modifie avec succes" });
  } catch (err) {
    console.error("[AUTH] ChangePassword error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── Update profile ─────────────────────────────────────────────

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      error(res, "Non authentifie", 401);
      return;
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) { fields.push("full_name = ?"); values.push(data.full_name); }
    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
    if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone); }
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

      const existing = await query<any[]>(
        `SELECT id FROM users WHERE (${conditions.join(" OR ")}) AND id != ?`,
        [...dupValues, req.user.userId]
      );

      if (existing.length > 0) {
        error(res, "Cet email ou ce telephone est deja utilise par un autre compte", 409);
        return;
      }
    }

    values.push(req.user.userId);
    await query<any>(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    // Retourner profil mis a jour
    const users = await query<any[]>(
      "SELECT id, full_name, email, phone, role, status, member_code, sport_goal FROM users WHERE id = ?",
      [req.user.userId]
    );

    success(res, users[0]);
  } catch (err) {
    console.error("[AUTH] UpdateProfile error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── Refresh token ──────────────────────────────────────────────

export async function refreshToken(req: Request, res: Response) {
  try {
    if (!req.user) {
      error(res, "Non authentifie", 401);
      return;
    }

    // Verifier que l'utilisateur existe toujours et est actif
    const users = await query<any[]>(
      "SELECT id, role, email, status FROM users WHERE id = ? AND status != 'DELETED'",
      [req.user.userId]
    );

    if (users.length === 0) {
      error(res, "Utilisateur introuvable", 404);
      return;
    }

    const user = users[0];

    if (user.status === "SUSPENDED") {
      error(res, "Compte suspendu", 403);
      return;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    success(res, { token });
  } catch (err) {
    console.error("[AUTH] Refresh error:", err);
    error(res, "Erreur serveur", 500);
  }
}
