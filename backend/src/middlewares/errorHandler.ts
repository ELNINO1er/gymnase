import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err.message);

  // Ne pas exposer les details en production
  const isDev = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: isDev ? err.message : "Erreur interne du serveur",
  });
}
