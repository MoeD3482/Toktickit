import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

const ticketNos = [
  "LAB4-SEED-001",
  "LAB4-SEED-002",
  "LAB4-SEED-003",
  "LAB4-SEED-004",
  "LAB4-SEED-005",
  "LAB4-SEED-006",
  "LAB4-SEED-007",
];

const actionIds = [
  "00000000-0000-4000-8000-000000000201",
  "00000000-0000-4000-8000-000000000202",
  "00000000-0000-4000-8000-000000000203",
  "00000000-0000-4000-8000-000000000204",
  "00000000-0000-4000-8000-000000000205",
  "00000000-0000-4000-8000-000000000206",
  "00000000-0000-4000-8000-000000000207",
];

async function main() {
  const tickets = await prisma.ticket.findMany({
    where: {
      ticketNo: {
        in: ticketNos,
      },
    },
    include: {
      actionsTaken: true,
    },
  });

  const actions = await prisma.actionTaken.findMany({
    where: {
      id: {
        in: actionIds,
      },
    },
  });

  const zeroActions = tickets.filter(
    (ticket) => ticket.actionsTaken.length === 0,
  ).length;

  const oneAction = tickets.filter(
    (ticket) => ticket.actionsTaken.length === 1,
  ).length;

  const multipleActions = tickets.filter(
    (ticket) => ticket.actionsTaken.length > 1,
  ).length;

  const assigned = tickets.filter(
    (ticket) => ticket.assignedToUserId !== null,
  ).length;

  const unassigned = tickets.filter(
    (ticket) => ticket.assignedToUserId === null,
  ).length;

  const followUpRequired = actions.filter(
    (action) => action.followUpRequired,
  ).length;

  console.log("\n===== LAB 4 SEED VERIFICATION =====");
  console.log("Tickets:", tickets.length);
  console.log("Actions Taken:", actions.length);
  console.log("Zero Actions:", zeroActions);
  console.log("One Action:", oneAction);
  console.log("Multiple Actions:", multipleActions);
  console.log("Assigned Tickets:", assigned);
  console.log("Unassigned Tickets:", unassigned);
  console.log("Follow-up Required:", followUpRequired);

  const valid =
    tickets.length === 7 &&
    actions.length === 7 &&
    zeroActions === 2 &&
    oneAction === 3 &&
    multipleActions === 2 &&
    assigned === 5 &&
    unassigned === 2 &&
    followUpRequired === 2;

  if (!valid) {
    throw new Error("Lab 4 seed verification failed.");
  }

  console.log("\nPASS: All Lab 4 seed scenarios verified.");
}

main()
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });