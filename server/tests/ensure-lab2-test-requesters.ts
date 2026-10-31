import { ensureLab2TestRequesters } from "./helpers/lab2-test-requesters.js";
import { getPrisma } from "../src/prisma.js";

try {
  await ensureLab2TestRequesters();
  console.log("Lab 2 test Requester accounts are ready.");
} catch (error) {
  console.error("Failed to prepare Lab 2 test Requester accounts:", error);
  process.exitCode = 1;
} finally {
  await getPrisma().$disconnect();
}
