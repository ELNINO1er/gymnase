import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";
import { logActivity } from "../services/activityLog.js";

const promoSchema = z.object({
  code: z.string().min(3).max(50).transform((v) => v.toUpperCase()),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]),
  discount_value: z.number().positive(),
  min_amount: z.number().min(0).default(0),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

// GET /api/promos
export async function getPromos(req: Request, res: Response) {
  try {
    const activeOnly = req.query.active === "true";
    const where = activeOnly ? "WHERE is_active = TRUE AND (end_date IS NULL OR end_date >= CURDATE())" : "";
    const promos = await query<any[]>(`SELECT * FROM promo_codes ${where} ORDER BY created_at DESC`);
    success(res, promos);
  } catch (err) {
    console.error("[PROMOS] getPromos error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// POST /api/promos
export async function createPromo(req: Request, res: Response) {
  try {
    const parsed = promoSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "), 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const d = parsed.data;

    // Verifier unicite
    const [existing] = await query<any[]>("SELECT id FROM promo_codes WHERE code = ?", [d.code]);
    if (existing) {
      error(res, "Ce code promo existe deja", 409, ErrorCode.DUPLICATE_ENTRY);
      return;
    }

    const result = await query<any>(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_amount, start_date, end_date, max_uses, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.code, d.discount_type, d.discount_value, d.min_amount, d.start_date || null, d.end_date || null, d.max_uses || null, d.is_active]
    );

    await logActivity(req, { action: "CREATE", targetType: "SETTING", targetId: result.insertId, description: `Code promo cree : ${d.code} (${d.discount_type} ${d.discount_value})` });

    success(res, { id: result.insertId, code: d.code }, 201, "Code promo cree");
  } catch (err) {
    console.error("[PROMOS] createPromo error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// POST /api/promos/apply — Appliquer un code promo
export async function applyPromo(req: Request, res: Response) {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) {
      error(res, "Code et montant requis", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const [promo] = await query<any[]>(
      "SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE",
      [String(code).toUpperCase()]
    );

    if (!promo) {
      error(res, "Code promo invalide ou inactif", 404, ErrorCode.NOT_FOUND);
      return;
    }

    // Verifier dates
    const now = new Date().toISOString().split("T")[0];
    if (promo.start_date && now < promo.start_date) {
      error(res, "Ce code promo n'est pas encore actif");
      return;
    }
    if (promo.end_date && now > promo.end_date) {
      error(res, "Ce code promo a expire");
      return;
    }

    // Verifier utilisations max
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      error(res, "Ce code promo a atteint son nombre maximum d'utilisations");
      return;
    }

    // Verifier montant minimum
    if (Number(amount) < Number(promo.min_amount)) {
      error(res, `Montant minimum requis : ${promo.min_amount} FCFA`);
      return;
    }

    // Calculer la reduction
    let discount = 0;
    if (promo.discount_type === "PERCENTAGE") {
      discount = Math.round(Number(amount) * Number(promo.discount_value) / 100);
    } else {
      discount = Math.min(Number(promo.discount_value), Number(amount));
    }

    const finalAmount = Number(amount) - discount;

    success(res, {
      code: promo.code,
      original_amount: Number(amount),
      discount,
      final_amount: finalAmount,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
    }, 200, "Code promo applique");
  } catch (err) {
    console.error("[PROMOS] applyPromo error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// PUT /api/promos/:id — Modifier
export async function updatePromo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active, end_date, max_uses } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active); }
    if (end_date !== undefined) { fields.push("end_date = ?"); values.push(end_date); }
    if (max_uses !== undefined) { fields.push("max_uses = ?"); values.push(max_uses); }

    if (fields.length === 0) {
      error(res, "Rien a modifier", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    values.push(id);
    await query<any>(`UPDATE promo_codes SET ${fields.join(", ")} WHERE id = ?`, values);
    success(res, null, 200, "Code promo modifie");
  } catch (err) {
    console.error("[PROMOS] updatePromo error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// DELETE /api/promos/:id
export async function deletePromo(req: Request, res: Response) {
  try {
    await query<any>("UPDATE promo_codes SET is_active = FALSE WHERE id = ?", [req.params.id]);
    success(res, null, 200, "Code promo desactive");
  } catch (err) {
    console.error("[PROMOS] deletePromo error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
