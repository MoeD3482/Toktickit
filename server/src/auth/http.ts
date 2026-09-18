import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { getSessionUserId } from "./session.js";

type AuthenticatedUser = {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  passwordState: string;
};

export function toSafeUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
    passwordState: user.passwordState,
  };
}

export async function getAuthenticatedUser(req: Request) {
  const userId = getSessionUserId(req);

  if (!userId) {
    return null;
  }

  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export function sendAuthenticationRequired(res: Response) {
  return res.status(401).json({
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "Sign in before using this feature.",
      fieldErrors: [],
    },
  });
}
