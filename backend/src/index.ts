import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { testConnection } from "./config/database.js";
import { sanitizeInputs } from "./middlewares/validate.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.nodeEnv === "production"
    ? env.frontendUrl
    : [env.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Trop de tentatives, reessayez dans 15 minutes" },
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: "Trop de requetes" },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Sanitize inputs (XSS protection)
app.use(sanitizeInputs);

// API Routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Start server
async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error("[SERVER] Impossible de se connecter a MySQL.");
    console.error(`[SERVER] Host: ${env.db.host}:${env.db.port}, DB: ${env.db.name}, User: ${env.db.user}`);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       ELITE GYM API - Backend            ║
╠══════════════════════════════════════════╣
║  Port:     ${String(env.port).padEnd(28)}║
║  Env:      ${env.nodeEnv.padEnd(28)}║
║  DB:       ${env.db.name.padEnd(28)}║
║  Frontend: ${env.frontendUrl.padEnd(28)}║
╚══════════════════════════════════════════╝
    `);
  });
}

start();
