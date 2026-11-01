import { LAB2_TEST_REQUESTER_PREFIX } from "./helpers/lab2-test-requesters.js";
import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  try {
    const requesterResult =
      await prisma.developmentRequester.updateMany({
        where: {
          email: { startsWith: LAB2_TEST_REQUESTER_PREFIX },
        },
        data: { isActive: false },
      });

    const userResult = await prisma.user.updateMany({
      where: {
        email: { startsWith: LAB2_TEST_REQUESTER_PREFIX },
      },
      data: { isActive: false },
    });

    console.log(
      `Deactivated ${requesterResult.count} test Requester profiles and ${userResult.count} test users.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to deactivate Lab 2 test accounts:", error);
  process.exitCode = 1;
});
