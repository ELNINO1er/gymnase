import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, paginated } from "../utils/response.js";
import { generateMemberCode, generateToken } from "../utils/token.js";

const gymSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  owner_name: z.string().max(150).optional().nullable(),
  owner_email: z.string().email().max(150).optional().nullable(),
  owner_phone: z.string().max(30).optional().nullable(),
  owner_password: z.string().min(6).max(100).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});

const platformAdminSchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  phone: z.string().min(8).max(30),
  password: z.string().min(8).max(100),
});

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listGyms(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const params: any[] = [];
    let where = "";

    if (status) {
      where = "WHERE g.status = ?";
      params.push(status);
    }

    const gyms = await query<any[]>(
      `SELECT g.*,
        COUNT(DISTINCT u.id) AS users_count,
        COUNT(DISTINCT CASE WHEN u.role IN ('ADMIN', 'SUPER_ADMIN') THEN u.id END) AS admins_count
       FROM gyms g
       LEFT JOIN users u ON u.gym_id = g.id AND u.status != 'DELETED'
       ${where}
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      params
    );

    success(res, gyms);
  } catch (err) {
    console.error("[PLATFORM] listGyms error:", err);
    error(res, "Erreur lors du chargement des salles", 500);
  }
}

export async function createGym(req: Request, res: Response) {
  try {
    const parsed = gymSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const data = parsed.data;
    const slug = data.slug || toSlug(data.name);
    const status = data.status || "PENDING";

    const result = await query<any>(
      `INSERT INTO gyms (name, slug, owner_name, owner_email, owner_phone, city, country, status, verified_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        slug,
        data.owner_name || null,
        data.owner_email || null,
        data.owner_phone || null,
        data.city || null,
        data.country || null,
        status,
        status === "ACTIVE" ? req.user?.userId : null,
      ]
    );

    if (data.owner_email && data.owner_password) {
      const passwordHash = await bcrypt.hash(data.owner_password, 12);
      await query<any>(
        `INSERT INTO users (gym_id, full_name, email, phone, password_hash, role, status, member_code)
         VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?)`,
        [
          result.insertId,
          data.owner_name || `Admin ${data.name}`,
          data.owner_email,
          data.owner_phone || null,
          passwordHash,
          generateMemberCode(),
        ]
      );
    }

    const gyms = await query<any[]>("SELECT * FROM gyms WHERE id = ?", [result.insertId]);
    success(res, gyms[0], 201);
  } catch (err: any) {
    console.error("[PLATFORM] createGym error:", err);
    if (err?.code === "ER_DUP_ENTRY") {
      error(res, "Une salle existe deja avec ce slug", 409);
      return;
    }
    error(res, "Erreur lors de la creation de la salle", 500);
  }
}

export async function updateGymStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const parsed = z.object({ status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]) }).safeParse(req.body);

    if (!Number.isFinite(id) || id <= 0) {
      error(res, "Salle invalide");
      return;
    }
    if (!parsed.success) {
      error(res, "Statut invalide");
      return;
    }

    await query<any>(
      `UPDATE gyms
       SET status = ?, verified_by = CASE WHEN ? = 'ACTIVE' THEN ? ELSE verified_by END, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [parsed.data.status, parsed.data.status, req.user?.userId || null, id]
    );

    const gyms = await query<any[]>("SELECT * FROM gyms WHERE id = ?", [id]);
    if (gyms.length === 0) {
      error(res, "Salle introuvable", 404);
      return;
    }

    success(res, gyms[0]);
  } catch (err) {
    console.error("[PLATFORM] updateGymStatus error:", err);
    error(res, "Erreur lors de la mise a jour de la salle", 500);
  }
}

export async function getPlatformSummary(_req: Request, res: Response) {
  try {
    const [gyms] = await query<any[]>(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'PENDING') AS pending,
        SUM(status = 'ACTIVE') AS active,
        SUM(status = 'SUSPENDED') AS suspended
       FROM gyms`
    );
    const [users] = await query<any[]>("SELECT COUNT(*) AS total_users FROM users WHERE status != 'DELETED'");

    success(res, {
      gyms: gyms || { total: 0, pending: 0, active: 0, suspended: 0 },
      users: users?.total_users || 0,
    });
  } catch (err) {
    console.error("[PLATFORM] summary error:", err);
    error(res, "Erreur lors du chargement du resume plateforme", 500);
  }
}

export async function listPlatformAdmins(_req: Request, res: Response) {
  try {
    const admins = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, created_at
       FROM users
       WHERE is_platform_admin = TRUE AND status != 'DELETED'
       ORDER BY created_at DESC`
    );

    success(res, admins);
  } catch (err) {
    console.error("[PLATFORM] listPlatformAdmins error:", err);
    error(res, "Erreur lors du chargement des super admins", 500);
  }
}

// ── GET /api/platform/gyms/:id — Fiche detail d'une salle ────

export async function getGymDetail(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      error(res, "Salle invalide");
      return;
    }

    const gyms = await query<any[]>(
      `SELECT g.*,
        COUNT(DISTINCT u.id) AS users_count,
        COUNT(DISTINCT CASE WHEN u.role = 'MEMBER' THEN u.id END) AS members_count,
        COUNT(DISTINCT CASE WHEN u.role IN ('ADMIN', 'SUPER_ADMIN') THEN u.id END) AS admins_count,
        COUNT(DISTINCT CASE WHEN u.role = 'COACH' THEN u.id END) AS coaches_count
       FROM gyms g
       LEFT JOIN users u ON u.gym_id = g.id AND u.status != 'DELETED'
       WHERE g.id = ?
       GROUP BY g.id`,
      [id]
    );

    if (gyms.length === 0) {
      error(res, "Salle introuvable", 404);
      return;
    }

    // Revenue stats
    const [revenue] = await query<any[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN status = 'PAID' AND MONTH(paid_at) = MONTH(CURDATE()) AND YEAR(paid_at) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS month_revenue,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) AS pending_revenue,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_count
       FROM payments WHERE gym_id = ?`,
      [id]
    );

    // Active subscriptions
    const [subs] = await query<any[]>(
      `SELECT COUNT(*) AS active_subs FROM subscriptions WHERE gym_id = ? AND status = 'ACTIVE' AND end_date >= CURDATE()`,
      [id]
    );

    // Admins list
    const admins = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, created_at
       FROM users WHERE gym_id = ? AND role IN ('ADMIN', 'SUPER_ADMIN') AND status != 'DELETED'
       ORDER BY created_at DESC`,
      [id]
    );

    success(res, {
      ...gyms[0],
      revenue: {
        total: Number(revenue.total_revenue),
        month: Number(revenue.month_revenue),
        pending: Number(revenue.pending_revenue),
        paid_count: revenue.paid_count,
        pending_count: revenue.pending_count,
      },
      active_subscriptions: subs.active_subs,
      admins,
    });
  } catch (err) {
    console.error("[PLATFORM] getGymDetail error:", err);
    error(res, "Erreur lors du chargement de la salle", 500);
  }
}

// ── POST /api/platform/gyms/:id/admins — Creer admin pour une salle

export async function createGymAdmin(req: Request, res: Response) {
  try {
    const gymId = Number(req.params.id);
    if (!Number.isFinite(gymId) || gymId <= 0) {
      error(res, "Salle invalide");
      return;
    }

    const gyms = await query<any[]>("SELECT id FROM gyms WHERE id = ?", [gymId]);
    if (gyms.length === 0) {
      error(res, "Salle introuvable", 404);
      return;
    }

    const parsed = platformAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { full_name, email, phone, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query<any>(
      `INSERT INTO users (gym_id, full_name, email, phone, password_hash, role, status, is_platform_admin, member_code)
       VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', FALSE, ?)`,
      [gymId, full_name, email, phone, passwordHash, generateMemberCode()]
    );

    const admins = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?`,
      [result.insertId]
    );

    success(res, admins[0], 201);
  } catch (err: any) {
    console.error("[PLATFORM] createGymAdmin error:", err);
    if (err?.code === "ER_DUP_ENTRY") {
      error(res, "Un utilisateur existe deja avec cet email ou telephone", 409);
      return;
    }
    error(res, "Erreur lors de la creation de l'admin", 500);
  }
}

// ── GET /api/platform/revenue — Revenus globaux par salle ────

export async function getPlatformRevenue(_req: Request, res: Response) {
  try {
    const revenue = await query<any[]>(
      `SELECT g.id, g.name, g.slug, g.status,
        COALESCE((
          SELECT SUM(p.amount) FROM payments p
          WHERE p.gym_id = g.id AND p.status = 'PAID'
        ), 0) AS total_revenue,
        COALESCE((
          SELECT SUM(p.amount) FROM payments p
          WHERE p.gym_id = g.id AND p.status = 'PAID'
            AND MONTH(p.paid_at) = MONTH(CURDATE()) AND YEAR(p.paid_at) = YEAR(CURDATE())
        ), 0) AS month_revenue,
        COALESCE((
          SELECT COUNT(*) FROM users u
          WHERE u.gym_id = g.id AND u.role = 'MEMBER' AND u.status != 'DELETED'
        ), 0) AS members_count
       FROM gyms g
       ORDER BY total_revenue DESC`
    );

    const totals = revenue.reduce(
      (acc, r) => ({
        total: acc.total + Number(r.total_revenue),
        month: acc.month + Number(r.month_revenue),
      }),
      { total: 0, month: 0 }
    );

    success(res, { gyms: revenue, totals });
  } catch (err) {
    console.error("[PLATFORM] getPlatformRevenue error:", err);
    error(res, "Erreur lors du chargement des revenus", 500);
  }
}

// ── GET /api/platform/logs — Journal global plateforme ───────

export async function getPlatformLogs(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = (page - 1) * limit;

    const [cnt] = await query<any[]>("SELECT COUNT(*) as total FROM activity_logs");

    const logs = await query<any[]>(
      `SELECT al.*, u.full_name as admin_name, g.name as gym_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       LEFT JOIN gyms g ON g.id = al.gym_id
       ORDER BY al.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
    );

    paginated(res, logs, cnt.total, page, limit);
  } catch (err) {
    console.error("[PLATFORM] getPlatformLogs error:", err);
    error(res, "Erreur lors du chargement des logs", 500);
  }
}

// ── POST /api/platform/switch-gym — Changer contexte salle ───

export async function switchGym(req: Request, res: Response) {
  try {
    const gymId = Number(req.body.gym_id);

    if (!req.user?.isPlatformAdmin) {
      error(res, "Reserve aux admins plateforme", 403);
      return;
    }

    if (gymId) {
      const gyms = await query<any[]>("SELECT id, name, status FROM gyms WHERE id = ?", [gymId]);
      if (gyms.length === 0) {
        error(res, "Salle introuvable", 404);
        return;
      }
    }

    // Generate new token with updated gymId
    const token = generateToken({
      userId: req.user.userId,
      role: req.user.role,
      email: req.user.email,
      gymId: gymId || null,
      isPlatformAdmin: true,
    });

    success(res, { token, gym_id: gymId || null });
  } catch (err) {
    console.error("[PLATFORM] switchGym error:", err);
    error(res, "Erreur lors du changement de salle", 500);
  }
}

export async function createPlatformAdmin(req: Request, res: Response) {
  try {
    const parsed = platformAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { full_name, email, phone, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query<any>(
      `INSERT INTO users (gym_id, full_name, email, phone, password_hash, role, status, is_platform_admin, member_code)
       VALUES (NULL, ?, ?, ?, ?, 'SUPER_ADMIN', 'ACTIVE', TRUE, ?)`,
      [full_name, email, phone, passwordHash, generateMemberCode()]
    );

    const admins = await query<any[]>(
      `SELECT id, full_name, email, phone, role, status, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    success(res, admins[0], 201);
  } catch (err: any) {
    console.error("[PLATFORM] createPlatformAdmin error:", err);
    if (err?.code === "ER_DUP_ENTRY") {
      error(res, "Un utilisateur existe deja avec cet email, telephone ou code", 409);
      return;
    }
    error(res, "Erreur lors de la creation du super admin", 500);
  }
}
