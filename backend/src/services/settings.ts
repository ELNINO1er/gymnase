import { query } from "../config/database.js";

/**
 * Recupere une valeur de configuration.
 */
export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<any[]>("SELECT setting_value, setting_type FROM settings WHERE setting_key = ?", [key]);
  if (rows.length === 0) return null;
  return rows[0].setting_value;
}

/**
 * Recupere une valeur numerique.
 */
export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const val = await getSetting(key);
  return val ? Number(val) : fallback;
}

/**
 * Recupere une valeur booleenne.
 */
export async function getSettingBool(key: string, fallback: boolean): Promise<boolean> {
  const val = await getSetting(key);
  if (val === null) return fallback;
  return val === "true" || val === "1";
}

/**
 * Recupere une valeur JSON.
 */
export async function getSettingJSON<T>(key: string, fallback: T): Promise<T> {
  const val = await getSetting(key);
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/**
 * Met a jour une valeur de configuration.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await query<any>(
    "UPDATE settings SET setting_value = ? WHERE setting_key = ?",
    [value, key]
  );
}

/**
 * Recupere toutes les configurations.
 */
export async function getAllSettings(): Promise<Record<string, any>> {
  const rows = await query<any[]>("SELECT setting_key, setting_value, setting_type, description FROM settings ORDER BY setting_key");
  const result: Record<string, any> = {};
  for (const row of rows) {
    let value: any = row.setting_value;
    if (row.setting_type === "NUMBER") value = Number(value);
    else if (row.setting_type === "BOOLEAN") value = value === "true" || value === "1";
    else if (row.setting_type === "JSON") { try { value = JSON.parse(value); } catch {} }
    result[row.setting_key] = { value, type: row.setting_type, description: row.description };
  }
  return result;
}
