import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error } from "../utils/response.js";
import { requireGymContext } from "../utils/access.js";

// ── Schemas ────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive("Le prix doit etre positif"),
  duration_days: z.number().int().positive("La duree doit etre positive"),
  is_active: z.boolean().default(true),
});

const updatePlanSchema = planSchema.partial();

// ── GET /api/plans — Liste des plans ───────────────────────────

export async function getPlans(req: Request, res: Response) {
  try {
    const activeOnly = req.query.active === "true";
    const gymId = req.user?.gymId || Number(req.query.gym_id) || 1;
    const whereParts = ["p.gym_id = ?"];
    const params: any[] = [gymId];

    if (activeOnly) whereParts.push("p.is_active = TRUE");
    const where = `WHERE ${whereParts.join(" AND ")}`;

    const plans = await query<any[]>(
      `SELECT p.*,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.gym_id = p.gym_id AND s.status = 'ACTIVE') as active_subscribers
       FROM membership_plans p ${where}
       ORDER BY p.price ASC`,
      params
    );

    success(res, plans);
  } catch (err) {
    console.error("[PLANS] getPlans error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/plans/:id ─────────────────────────────────────────

export async function getPlanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = req.user?.gymId || Number(req.query.gym_id) || 1;

    const plans = await query<any[]>(
      `SELECT p.*,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.gym_id = p.gym_id AND s.status = 'ACTIVE') as active_subscribers,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.gym_id = p.gym_id) as total_subscribers
       FROM membership_plans p WHERE p.id = ? AND p.gym_id = ?`,
      [id, gymId]
    );

    if (plans.length === 0) {
      error(res, "Plan introuvable", 404);
      return;
    }

    success(res, plans[0]);
  } catch (err) {
    console.error("[PLANS] getPlanById error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── POST /api/plans — Creer un plan (admin) ────────────────────

export async function createPlan(req: Request, res: Response) {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const { name, description, price, duration_days, is_active } = parsed.data;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const result = await query<any>(
      `INSERT INTO membership_plans (gym_id, name, description, price, duration_days, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [gymId, name, description || null, price, duration_days, is_active]
    );

    success(res, {
      id: result.insertId,
      name,
      description,
      price,
      duration_days,
      is_active,
    }, 201);
  } catch (err) {
    console.error("[PLANS] createPlan error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── PUT /api/plans/:id — Modifier un plan ──────────────────────

export async function updatePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const existing = await query<any[]>("SELECT id FROM membership_plans WHERE id = ? AND gym_id = ?", [id, gymId]);
    if (existing.length === 0) {
      error(res, "Plan introuvable", 404);
      return;
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
    if (data.price !== undefined) { fields.push("price = ?"); values.push(data.price); }
    if (data.duration_days !== undefined) { fields.push("duration_days = ?"); values.push(data.duration_days); }
    if (data.is_active !== undefined) { fields.push("is_active = ?"); values.push(data.is_active); }

    if (fields.length === 0) {
      error(res, "Aucune donnee a modifier");
      return;
    }

    values.push(id, gymId);
    await query<any>(`UPDATE membership_plans SET ${fields.join(", ")} WHERE id = ? AND gym_id = ?`, values);

    const updated = await query<any[]>("SELECT * FROM membership_plans WHERE id = ? AND gym_id = ?", [id, gymId]);
    success(res, updated[0]);
  } catch (err) {
    console.error("[PLANS] updatePlan error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── DELETE /api/plans/:id — Desactiver un plan ─────────────────

export async function deletePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const existing = await query<any[]>("SELECT id FROM membership_plans WHERE id = ? AND gym_id = ?", [id, gymId]);
    if (existing.length === 0) {
      error(res, "Plan introuvable", 404);
      return;
    }

    // Soft delete : desactiver plutot que supprimer
    await query<any>("UPDATE membership_plans SET is_active = FALSE WHERE id = ? AND gym_id = ?", [id, gymId]);

    success(res, { message: "Plan desactive" });
  } catch (err) {
    console.error("[PLANS] deletePlan error:", err);
    error(res, "Erreur serveur", 500);
  }
}
