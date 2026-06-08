import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: number;
  role: string;
  email: string;
  gymId?: number | null;
  isPlatformAdmin?: boolean;
  activeGymId?: number | null;
  activeGymSlug?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token manquant ou invalide", error: "TOKEN_MISSING" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token expire ou invalide", error: "TOKEN_EXPIRED" });
  }
}

export function optionalAuthGuard(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch {
    // Public routes must keep working when no valid session is available.
  }

  next();
}

export function roleGuard(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Non authentifie", error: "TOKEN_MISSING" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Acces refuse : role insuffisant", error: "FORBIDDEN" });
      return;
    }

    // Platform admin must have selected a gym to access gym-scoped routes
    if (req.user.isPlatformAdmin && !req.user.activeGymId && !req.user.gymId) {
      res.status(403).json({ success: false, message: "Selectionnez une salle avant d'acceder a cet espace", error: "GYM_CONTEXT_REQUIRED" });
      return;
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Non authentifie", error: "TOKEN_MISSING" });
    return;
  }

  const role = req.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    res.status(403).json({ success: false, message: "Acces reserve aux administrateurs", error: "FORBIDDEN" });
    return;
  }

  // Determine effective gym context
  const effectiveGymId = req.user.isPlatformAdmin
    ? req.user.activeGymId
    : req.user.gymId;

  if (!effectiveGymId) {
    res.status(403).json({ success: false, message: "Selectionnez une salle avant d'acceder a cet espace", error: "GYM_CONTEXT_REQUIRED" });
    return;
  }

  next();
}

export function platformGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Non authentifie", error: "TOKEN_MISSING" });
    return;
  }

  if (!req.user.isPlatformAdmin) {
    res.status(403).json({ success: false, message: "Acces plateforme refuse", error: "PLATFORM_FORBIDDEN" });
    return;
  }

  next();
}
