import { Request, Response } from "express";
import { z } from "zod";
import { success, error } from "../utils/response.js";
import { getAllSettings, setSetting } from "../services/settings.js";
import { logActivity } from "../services/activityLog.js";

// ── GET /api/settings — Toutes les config (public: nom, tel, adresse, devise)

export async function getPublicSettings(req: Request, res: Response) {
  try {
    const all = await getAllSettings();
    // Filtrer les cles publiques
    const publicKeys = ["gym_name", "gym_phone", "gym_address", "gym_email", "gym_currency", "gym_logo_url", "wave_payment_link", "opening_hours", "allow_trial_session"];
    const publicSettings: Record<string, any> = {};
    for (const key of publicKeys) {
      if (all[key]) publicSettings[key] = all[key].value;
    }
    success(res, publicSettings);
  } catch (err) {
    console.error("[SETTINGS] getPublicSettings error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── GET /api/settings/all — Toutes les config (admin)

export async function getAllSettingsAdmin(req: Request, res: Response) {
  try {
    const all = await getAllSettings();
    success(res, all);
  } catch (err) {
    console.error("[SETTINGS] getAllSettings error:", err);
    error(res, "Erreur serveur", 500);
  }
}

// ── PUT /api/settings — Modifier des config (admin)

const updateSchema = z.record(z.string(), z.string());

export async function updateSettings(req: Request, res: Response) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, "Format invalide : { cle: valeur }");
      return;
    }

    const entries = Object.entries(parsed.data);
    for (const [key, value] of entries) {
      await setSetting(key, value);
    }

    await logActivity(req, {
      action: "UPDATE",
      targetType: "SETTING",
      description: `Configuration modifiee : ${entries.map(([k]) => k).join(", ")}`,
      metadata: parsed.data,
    });

    success(res, { updated: entries.length }, 200, "Configuration mise a jour");
  } catch (err) {
    console.error("[SETTINGS] updateSettings error:", err);
    error(res, "Erreur serveur", 500);
  }
}
