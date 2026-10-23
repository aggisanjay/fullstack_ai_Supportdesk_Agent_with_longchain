import { Response } from "express";
import * as jwt from "jsonwebtoken";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
};

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}

export function setSessionCookie(res: Response, user: SessionUser) {
  const secret = process.env.SESSION_JWT_SECRET || "default_dev_secret_jwt_key_32bytes!";
  const cookieName = process.env.SESSION_COOKIE_NAME || "session";

  const token = jwt.sign(user, secret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });

  res.cookie(cookieName, token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "session";
  res.clearCookie(cookieName, cookieOptions());
}

export function readSessionCookie(req: { cookies?: Record<string, string> }): SessionUser | null {
  const cookieName = process.env.SESSION_COOKIE_NAME || "session";
  const token = req.cookies?.[cookieName];

  if (!token) return null;

  try {
    const secret = process.env.SESSION_JWT_SECRET || "default_dev_secret_jwt_key_32bytes!";
    const decoded = jwt.verify(token, secret) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}
