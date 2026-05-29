import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/database.js";
import { success, error, ErrorCode } from "../utils/response.js";
import { logActivity } from "../services/activityLog.js";

const branchSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  email: z.string().email().max(150).optional().nullable(),
  is_active: z.boolean().default(true),
});

// GET /api/branches
export async function getBranches(req: Request, res: Response) {
  try {
    const branches = await query<any[]>(
      `SELECT b.*,
        (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.status != 'DELETED') as member_count
       FROM branches b ORDER BY b.name`
    );
    success(res, branches);
  } catch (err) {
    console.error("[BRANCHES] getBranches error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// POST /api/branches
export async function createBranch(req: Request, res: Response) {
  try {
    const parsed = branchSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "), 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const d = parsed.data;
    const result = await query<any>(
      "INSERT INTO branches (name, address, phone, city, email, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [d.name, d.address || null, d.phone || null, d.city || null, d.email || null, d.is_active]
    );

    await logActivity(req, { action: "CREATE", targetType: "SETTING", targetId: result.insertId, description: `Branche creee : ${d.name}` });

    success(res, { id: result.insertId, ...d }, 201, "Branche creee");
  } catch (err) {
    console.error("[BRANCHES] createBranch error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// PUT /api/branches/:id
export async function updateBranch(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parsed = branchSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors.map((e) => e.message).join(", "), 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    const d = parsed.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (d.name !== undefined) { fields.push("name = ?"); values.push(d.name); }
    if (d.address !== undefined) { fields.push("address = ?"); values.push(d.address); }
    if (d.phone !== undefined) { fields.push("phone = ?"); values.push(d.phone); }
    if (d.city !== undefined) { fields.push("city = ?"); values.push(d.city); }
    if (d.email !== undefined) { fields.push("email = ?"); values.push(d.email); }
    if (d.is_active !== undefined) { fields.push("is_active = ?"); values.push(d.is_active); }

    if (fields.length === 0) {
      error(res, "Rien a modifier", 400, ErrorCode.VALIDATION_ERROR);
      return;
    }

    values.push(id);
    await query<any>(`UPDATE branches SET ${fields.join(", ")} WHERE id = ?`, values);

    success(res, null, 200, "Branche modifiee");
  } catch (err) {
    console.error("[BRANCHES] updateBranch error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}

// DELETE /api/branches/:id
export async function deleteBranch(req: Request, res: Response) {
  try {
    await query<any>("UPDATE branches SET is_active = FALSE WHERE id = ?", [req.params.id]);
    success(res, null, 200, "Branche desactivee");
  } catch (err) {
    console.error("[BRANCHES] deleteBranch error:", err);
    error(res, "Erreur serveur", 500, ErrorCode.INTERNAL_ERROR);
  }
}
