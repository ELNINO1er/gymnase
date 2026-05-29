import { Request, Response, NextFunction } from "express";

/**
 * Middleware pour nettoyer les inputs (protection XSS basique)
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: Record<string, any>) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      // Supprimer les balises HTML potentiellement dangereuses
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .trim();
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
