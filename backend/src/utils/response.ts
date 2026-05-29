import { Response } from "express";

// ── Codes d'erreur standardises ────────────────────────────────

export const ErrorCode = {
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_MISSING: "TOKEN_MISSING",
  FORBIDDEN: "FORBIDDEN",
  ACCOUNT_PENDING: "ACCOUNT_PENDING",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  NOT_FOUND: "NOT_FOUND",

  // Business
  SLOT_FULL: "SLOT_FULL",
  DUPLICATE_RESERVATION: "DUPLICATE_RESERVATION",
  NO_ACTIVE_SUBSCRIPTION: "NO_ACTIVE_SUBSCRIPTION",
  PAST_DATE: "PAST_DATE",
  ALREADY_PROCESSED: "ALREADY_PROCESSED",
  CANCELLATION_TOO_LATE: "CANCELLATION_TOO_LATE",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ── Reponses standardisees ─────────────────────────────────────

export function success(res: Response, data: unknown, statusCode = 200, message?: string) {
  const body: Record<string, any> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function error(res: Response, message: string, statusCode = 400, code?: ErrorCodeType) {
  res.status(statusCode).json({
    success: false,
    message,
    error: code || httpStatusToCode(statusCode),
  });
}

export function paginated(res: Response, data: unknown[], total: number, page: number, limit: number) {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ── Helper : code par defaut selon le status HTTP ──────────────

function httpStatusToCode(status: number): string {
  switch (status) {
    case 401: return ErrorCode.INVALID_CREDENTIALS;
    case 403: return ErrorCode.FORBIDDEN;
    case 404: return ErrorCode.NOT_FOUND;
    case 409: return ErrorCode.DUPLICATE_ENTRY;
    case 429: return ErrorCode.RATE_LIMITED;
    case 500: return ErrorCode.INTERNAL_ERROR;
    default: return ErrorCode.VALIDATION_ERROR;
  }
}
