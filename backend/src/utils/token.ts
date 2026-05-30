import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../middlewares/auth.js";

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function generateMemberCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MBR${timestamp}${random}`;
}
