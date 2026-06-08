import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { pool } from "./database.js";
import { env } from "./env.js";

function splitSqlClauses(input: string) {
  const clauses: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const prev = input[i - 1];

    if ((char === "'" || char === '"' || char === "`") && prev !== "\\") {
      quote = quote === char ? null : quote || char;
    }

    if (!quote) {
      if (char === "(") depth += 1;
      else if (char === ")") depth = Math.max(0, depth - 1);
      else if (char === "," && depth === 0) {
        clauses.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) clauses.push(current.trim());
  return clauses;
}

async function columnExists(connection: any, tableName: string, columnName: string) {
  const [rows] = await connection.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [env.db.name, tableName, columnName]
  );
  return (rows as any[]).length > 0;
}

async function indexExists(connection: any, tableName: string, indexName: string) {
  const [rows] = await connection.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [env.db.name, tableName, indexName]
  );
  return (rows as any[]).length > 0;
}

async function executeStatement(connection: any, statement: string) {
  const trimmed = statement
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (!trimmed) return;

  const alterMatch = trimmed.match(/^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+(.+)$/is);

  if (alterMatch && /DROP\s+INDEX\s+IF\s+EXISTS/i.test(alterMatch[2])) {
    const tableName = alterMatch[1];
    const clauses = splitSqlClauses(alterMatch[2]);

    for (const clause of clauses) {
      const dropMatch = clause.match(/^DROP\s+INDEX\s+IF\s+EXISTS\s+`?([a-zA-Z0-9_]+)`?$/is);
      if (!dropMatch) {
        await connection.query(`ALTER TABLE \`${tableName}\` ${clause}`);
        continue;
      }

      const indexName = dropMatch[1];
      if (!(await indexExists(connection, tableName, indexName))) continue;

      await connection.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
    }
    return;
  }

  if (alterMatch && /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(alterMatch[2])) {
    const tableName = alterMatch[1];
    const clauses = splitSqlClauses(alterMatch[2]);

    for (const clause of clauses) {
      const addMatch = clause.match(/^ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?([a-zA-Z0-9_]+)`?\s+(.+)$/is);
      if (!addMatch) {
        await connection.query(`ALTER TABLE \`${tableName}\` ${clause}`);
        continue;
      }

      const columnName = addMatch[1];
      if (await columnExists(connection, tableName, columnName)) continue;

      await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${addMatch[2]}`);
    }
    return;
  }

  const createIndexMatch = trimmed.match(/^CREATE\s+(UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+`?([a-zA-Z0-9_]+)`?\s+ON\s+`?([a-zA-Z0-9_]+)`?\s*(\(.+\))$/is);
  if (createIndexMatch) {
    const unique = createIndexMatch[1] || "";
    const indexName = createIndexMatch[2];
    const tableName = createIndexMatch[3];
    const definition = createIndexMatch[4];
    if (await indexExists(connection, tableName, indexName)) return;

    await connection.query(`CREATE ${unique}INDEX \`${indexName}\` ON \`${tableName}\` ${definition}`);
    return;
  }

  await connection.query(trimmed);
}

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
        await executeStatement(connection, statement);
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
