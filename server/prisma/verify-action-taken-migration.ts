import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

const migrationName =
  "20261029071100_add_action_taken_model";

const ticketNumbers = [
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

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`Verification failed: ${message}`);
  }
}

async function main() {
  console.log("===== ACTION TAKEN MIGRATION VERIFICATION =====");

  // 1. Verify the migration was successfully applied.
  const migrations = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM "_prisma_migrations"
    WHERE migration_name = ${migrationName}
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  `;

  assert(
    migrations[0].count === 1,
    "ActionTaken migration is not successfully applied.",
  );

  console.log("Migration applied: PASS");

  // 2. Verify existing Ticket and User records are present.
  const userCount = await prisma.user.count();
  const ticketCount = await prisma.ticket.count();

  assert(userCount > 0, "No User records found.");
  assert(ticketCount > 0, "No Ticket records found.");

  console.log(`Existing Users: ${userCount}`);
  console.log(`Existing Tickets: ${ticketCount}`);

  // 3. Verify seeded tickets and their Actions Taken.
  const tickets = await prisma.ticket.findMany({
    where: {
      ticketNo: {
        in: ticketNumbers,
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

  assert(tickets.length === 7, "Expected 7 seeded Tickets.");
  assert(actions.length === 7, "Expected 7 seeded Actions Taken.");

  const zeroActions = tickets.filter(
    (ticket) => ticket.actionsTaken.length === 0,
  ).length;

  const oneAction = tickets.filter(
    (ticket) => ticket.actionsTaken.length === 1,
  ).length;

  const multipleActions = tickets.filter(
    (ticket) => ticket.actionsTaken.length > 1,
  ).length;

  assert(zeroActions === 2, "Expected 2 zero-action Tickets.");
  assert(oneAction === 3, "Expected 3 one-action Tickets.");
  assert(multipleActions === 2, "Expected 2 multiple-action Tickets.");

  console.log("Zero Actions Taken: 2 — PASS");
  console.log("One Action Taken: 3 — PASS");
  console.log("Multiple Actions Taken: 2 — PASS");

  // 4. Verify no orphaned ActionTaken records.
  const orphanActions = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM "ActionTaken" a
    LEFT JOIN "Ticket" t ON t.id = a."ticketId"
    WHERE t.id IS NULL
  `;

  assert(
    orphanActions[0].count === 0,
    "Found ActionTaken records without a Ticket.",
  );

  const orphanPerformers = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM "ActionTaken" a
    LEFT JOIN "User" u ON u.id = a."performedByUserId"
    WHERE u.id IS NULL
  `;

  assert(
    orphanPerformers[0].count === 0,
    "Found ActionTaken records without a valid performer.",
  );

  console.log("Ticket foreign-key integrity: PASS");
  console.log("User foreign-key integrity: PASS");

  // 5. Verify both foreign keys exist.
  const foreignKeys = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM pg_constraint
    WHERE conrelid = '"ActionTaken"'::regclass
      AND contype = 'f'
  `;

  assert(
    foreignKeys[0].count === 2,
    "Expected two ActionTaken foreign keys.",
  );

  console.log("Foreign-key constraints: PASS");

  // 6. Verify both required indexes exist.
  const indexes = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'ActionTaken'
      AND indexname IN (
        'ActionTaken_ticketId_actionAt_idx',
        'ActionTaken_performedByUserId_idx'
      )
  `;

  assert(
    indexes[0].count === 2,
    "Expected both ActionTaken indexes.",
  );

  console.log("Database indexes: PASS");

  console.log(
    "\nPASS: Current database migration integrity verified.",
  );
  console.log("No database records were modified.");
}

main()
  .catch((error) => {
    console.error("\nVerification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });