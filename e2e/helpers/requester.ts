
import { hashPassword } from "../../server/src/auth/password.js";
import { getPrisma } from "../../server/src/prisma.js";

export const E2E_REQUESTER_PASSWORD = "E2E-Requester-12345";
const E2E_REQUESTER_EMAIL = "e2e-requester@toktickit.test";

export async function ensureE2ERequester() {
  const prisma = getPrisma();

  const passwordHash = await hashPassword(
    E2E_REQUESTER_PASSWORD
  );

  const user = await prisma.user.upsert({
    where: { email: E2E_REQUESTER_EMAIL },
    update: {
      displayName: "E2E Test Requester",
      passwordHash,
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    },
    create: {
      displayName: "E2E Test Requester",
      email: E2E_REQUESTER_EMAIL,
      passwordHash,
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    },
  });

  await prisma.developmentRequester.upsert({
    where: { id: user.id },
    update: {
      displayName: user.displayName,
      email: user.email,
      isActive: true,
    },
    create: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      isActive: true,
    },
  });

  return {
    email: E2E_REQUESTER_EMAIL,
    password: E2E_REQUESTER_PASSWORD,
  };
}
