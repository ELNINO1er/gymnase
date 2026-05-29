import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { pool } from "./database.js";
import { env } from "./env.js";

async function migrate() {
  console.log("[MIGRATE] Demarrage des migrations...");
  console.log(`[MIGRATE] Base: ${env.db.name} @ ${env.db.host}:${env.db.port}`);

  const connection = await pool.getConnection();

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``);
    await connection.query(`USE \`${env.db.name}\``);

    // Create migrations tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read migration files
    const migrationsDir = resolve(import.meta.dirname, "../../../database/migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

    // Get already executed migrations
    const [executed] = await connection.query("SELECT name FROM _migrations");
    const executedNames = (executed as { name: string }[]).map((r) => r.name);

    for (const file of files) {
      if (executedNames.includes(file)) {
        console.log(`[MIGRATE] Deja executee: ${file}`);
        continue;
      }

      const sql = readFileSync(resolve(migrationsDir, file), "utf-8");
      const statements = sql.split(";").filter((s) => s.trim());

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query("INSERT INTO _migrations (name) VALUES (?)", [file]);
      console.log(`[MIGRATE] Executee: ${file}`);
    }

    console.log("[MIGRATE] Toutes les migrations sont a jour.");
  } catch (error) {
    console.error("[MIGRATE] Erreur:", error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate();
