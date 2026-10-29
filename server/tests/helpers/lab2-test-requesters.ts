import { hashPassword } from "../../src/auth/password.js";
import { getPrisma } from "../../src/prisma.js";

export const LAB2_TEST_REQUESTER_PREFIX =
  "lab2-test-requester-";

const TEST_PASSWORD = "ChangeMe123!";

const TEST_REQUESTERS = [
  {
    suffix: "a",
    displayName: "Lab 2 Test Requester A",
  },
  {
    suffix: "b",
    displayName: "Lab 2 Test Requester B",
  },
] as const;

export async function ensureLab2TestRequesters() {
  const prisma = getPrisma();
  const passwordHash = await hashPassword(TEST_PASSWORD);

  for (const fixture of TEST_REQUESTERS) {
    const email =
      `${LAB2_TEST_REQUESTER_PREFIX}${fixture.suffix}@example.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: fixture.displayName,
        passwordHash,
        roles: ["Requester"],
        isActive: true,
        passwordState: "Active",
      },
      create: {
        displayName: fixture.displayName,
        email,
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
  }
}
