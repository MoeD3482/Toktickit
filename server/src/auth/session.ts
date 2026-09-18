import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

const SESSION_COOKIE_NAME = "toktickit_session";
const sessions = new Map<string, string>();

export function createSession(res: Response, userId: string): string {
  const sessionId = randomUUID();

  sessions.set(sessionId, userId);

  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return sessionId;
}

export function destroySession(req: Request, res: Response): void {
  const sessionId = getSessionId(req);

  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function getSessionUserId(req: Request): string | null {
  const sessionId = getSessionId(req);

  if (!sessionId) {
    return null;
  }

  return sessions.get(sessionId) ?? null;
}

export function clearSessionsForTests(): void {
  sessions.clear();
}

function getSessionId(req: Request): string | null {
  const cookieHeader = req.header("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");

    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}
