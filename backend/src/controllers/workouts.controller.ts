import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, paginated, ErrorCode } from "../utils/response.js";
import { canAccessUserResource, isAdminRole, requireGymContext } from "../utils/access.js";

const exerciseSchema = z.object({
  day_number: z.number().int().min(1).default(1),
  exercise_name: z.string().min(1).max(150),
  sets_count: z.number().int().positive().optional().nullable(),
  reps_count: z.number().int().positive().optional().nullable(),
  weight_kg: z.number().positive().optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  rest_seconds: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().default(0),
});

const planSchema = z.object({
  user_id: z.number().int().positive(),
  title: z.string().min(2).max(150),
  description: z.string().max(1000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  exercises: z.array(exerciseSchema).optional(),
});

// GET /api/workouts — Tous les plans (admin/coach)
export async function getPlans(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const userId = req.query.user_id as string || "";

    let where = "WHERE wp.gym_id = ?";
    const params: any[] = [gymId];
    if (userId) { where += " AND wp.user_id = ?"; params.push(userId); }

    // Si coach, seulement ses plans
    if (req.user!.role === "COACH") {
      where += " AND wp.coach_id = ?";
      params.push(req.user!.userId);
    }

    const [cnt] = await query<any[]>(`SELECT COUNT(*) as total FROM workout_plans wp ${where}`, params);

    const plans = await query<any[]>(
      `SELECT wp.*, u.full_name as member_name, c.full_name as coach_name,
              (SELECT COUNT(*) FROM workout_exercises we WHERE we.plan_id = wp.id) as exercise_count
       FROM workout_plans wp
       JOIN users u ON u.id = wp.user_id
       LEFT JOIN users c ON c.id = wp.coach_id
       ${where}
       ORDER BY wp.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    paginated(res, plans, cnt.total, page, limit);
  } catch (err) {
    console.error("[WORKOUTS] getPlans error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/workouts/user/:userId — Plans d'un membre
export async function getUserPlans(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!canAccessUserResource(req, res, userId)) return;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const plans = await query<any[]>(
      `SELECT wp.*, c.full_name as coach_name,
              (SELECT COUNT(*) FROM workout_exercises we WHERE we.plan_id = wp.id) as exercise_count
       FROM workout_plans wp
       LEFT JOIN users c ON c.id = wp.coach_id
       WHERE wp.user_id = ? AND wp.gym_id = ?
       ORDER BY wp.created_at DESC`,
      [userId, gymId]
    );

    success(res, plans);
  } catch (err) {
    console.error("[WORKOUTS] getUserPlans error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// GET /api/workouts/:id — Detail d'un plan + exercices
export async function getPlanDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const [plan] = await query<any[]>(
      `SELECT wp.*, u.full_name as member_name, c.full_name as coach_name
       FROM workout_plans wp
       JOIN users u ON u.id = wp.user_id
       LEFT JOIN users c ON c.id = wp.coach_id
       WHERE wp.id = ? AND wp.gym_id = ?`,
      [id, gymId]
    );

    if (!plan) {
      error(res, "Programme introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }

    if (!isAdminRole(req.user?.role) && req.user?.role !== "COACH" && req.user?.userId !== Number(plan.user_id)) {
      error(res, "Acces refuse", 403, ErrorCode.FORBIDDEN);
      return;
    }

    const exercises = await query<any[]>(
      "SELECT * FROM workout_exercises WHERE plan_id = ? ORDER BY day_number, sort_order",
      [id]
    );

    success(res, { ...plan, exercises });
  } catch (err) {
    console.error("[WORKOUTS] getPlanDetail error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// POST /api/workouts — Creer un plan + exercices
export async function createPlan(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "), 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const d = parsed.data;
    const coachId = req.user!.userId;

    const [member] = await query<any[]>(
      "SELECT id FROM users WHERE id = ? AND gym_id = ? AND status != 'DELETED'",
      [d.user_id, gymId]
    );
    if (!member) {
      error(res, "Membre introuvable dans cette salle", 404, ErrorCode.NOT_FOUND);
      return;
    }

    const result = await query<any>(
      `INSERT INTO workout_plans (gym_id, user_id, coach_id, title, description, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gymId, d.user_id, coachId, d.title, d.description || null, d.start_date || null, d.end_date || null]
    );

    const planId = result.insertId;

    // Inserer exercices
    if (d.exercises && d.exercises.length > 0) {
      for (const ex of d.exercises) {
        await query<any>(
          `INSERT INTO workout_exercises (plan_id, day_number, exercise_name, sets_count, reps_count, weight_kg, duration_minutes, rest_seconds, notes, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [planId, ex.day_number, ex.exercise_name, ex.sets_count || null, ex.reps_count || null, ex.weight_kg || null, ex.duration_minutes || null, ex.rest_seconds || null, ex.notes || null, ex.sort_order]
        );
      }
    }

    success(res, { id: planId, exercise_count: d.exercises?.length || 0 }, 201, "Programme cree");
  } catch (err) {
    console.error("[WORKOUTS] createPlan error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// PUT /api/workouts/:id/status — Changer statut
export async function updatePlanStatus(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!["ACTIVE", "COMPLETED", "CANCELLED"].includes(newStatus)) {
      error(res, "Statut invalide", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const result = await query<any>("UPDATE workout_plans SET status = ? WHERE id = ? AND gym_id = ?", [newStatus, id, gymId]);
    if (result.affectedRows === 0) {
      error(res, "Programme introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }
    success(res, null, 200, "Statut mis a jour");
  } catch (err) {
    console.error("[WORKOUTS] updatePlanStatus error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// DELETE /api/workouts/:id
export async function deletePlan(req: Request, res: Response) {
  try {
    const gymId = requireGymContext(req, res);
    if (!gymId) return;

    const { id } = req.params;
    const result = await query<any>("DELETE FROM workout_plans WHERE id = ? AND gym_id = ?", [id, gymId]);
    if (result.affectedRows === 0) {
      error(res, "Programme introuvable", 404, ErrorCode.NOT_FOUND);
      return;
    }
    success(res, null, 200, "Programme supprime");
  } catch (err) {
    console.error("[WORKOUTS] deletePlan error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
