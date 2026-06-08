import { Request, Response } from "express";
import { error, ErrorCode } from "./response.js";

export function isAdminRole(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Returns the effective gym ID for the current request.
 * - Platform admin: uses activeGymId (temporarily selected gym)
 * - Regular admin/user: uses gymId (permanent assignment)
 */
export function getCurrentGymId(req: Request): number | null {
  if (!req.user) return null;

  if (req.user.isPlatformAdmin) {
    const activeId = req.user.activeGymId;
    return typeof activeId === "number" && Number.isInteger(activeId) && activeId > 0
      ? activeId
      : null;
  }

  const gymId = req.user.gymId;
  return typeof gymId === "number" && Number.isInteger(gymId) && gymId > 0 ? gymId : null;
}

// Alias for backward compatibility
export function getRequestGymId(req: Request) {
  return getCurrentGymId(req);
}

export function requireGymContext(req: Request, res: Response) {
  const gymId = getCurrentGymId(req);
  if (!gymId) {
    error(res, "Selectionnez une salle avant d'acceder a cet espace", 403, ErrorCode.FORBIDDEN);
    return null;
  }
  return gymId;
}

export function canAccessUserResource(req: Request, res: Response, userIdParam: string) {
  if (!req.user) {
    error(res, "Non authentifie", 401, ErrorCode.TOKEN_MISSING);
    return false;
  }

  const userId = Number(userIdParam);
  if (!Number.isInteger(userId) || userId <= 0) {
    error(res, "Identifiant utilisateur invalide", 400, ErrorCode.VALIDATION_ERROR);
    return false;
  }

  if (!isAdminRole(req.user.role) && req.user.userId !== userId) {
    error(res, "Acces refuse", 403, ErrorCode.FORBIDDEN);
    return false;
  }

  return true;
}
