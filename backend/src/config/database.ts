import mysql from "mysql2/promise";
import { env } from "./env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("[DB] Connexion MySQL reussie");
    connection.release();
    return true;
  } catch (error) {
    console.error("[DB] Erreur de connexion MySQL:", error);
    return false;
  }
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
