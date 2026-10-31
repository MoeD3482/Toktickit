import { getPrisma } from "../src/prisma.js";

const fixtures = [
  {
    no: "001", status: "New", priority: "Urgent", assigned: true,
    summary: "Lab 4 seed: New ticket without actions", actions: [],
  },
  {
    no: "002", status: "Open", priority: "High", assigned: true,
    summary: "Lab 4 seed: Open ticket with one action",
    actions: [{
      key: "lab4-seed-002-action-1",
      description: "Checked network configuration",
      result: "Configuration verified",
      followUpRequired: false,
      followUpNote: null,
    }],
  },
  {
    no: "003", status: "InProgress", priority: "Medium", assigned: true,
    summary: "Lab 4 seed: In progress with multiple actions",
    actions: [
      {
        key: "lab4-seed-003-action-1",
        description: "Inspected the reported issue",
        result: "Cause identified",
        followUpRequired: false,
        followUpNote: null,
      },
      {
        key: "lab4-seed-003-action-2",
        description: "Applied a corrective configuration",
        result: "Testing in progress",
        followUpRequired: false,
        followUpNote: null,
      },
    ],
  },
  {
    no: "004", status: "WaitingForRequester", priority: "Low", assigned: true,
    summary: "Lab 4 seed: Waiting for requester follow-up",
    actions: [{
      key: "lab4-seed-004-action-1",
      description: "Requested additional information",
      result: "Waiting for requester confirmation",
      followUpRequired: true,
      followUpNote: "Please confirm whether the issue persists.",
    }],
  },
  {
    no: "005", status: "Resolved", priority: "High", assigned: true,
    summary: "Lab 4 seed: Resolved ticket",
    actions: [{
      key: "lab4-seed-005-action-1",
      description: "Repaired the reported issue",
      result: "Requester issue resolved",
      followUpRequired: false,
      followUpNote: null,
    }],
  },
  {
    no: "006", status: "Closed", priority: "Low", assigned: false,
    summary: "Lab 4 seed: Closed ticket without actions", actions: [],
  },
  {
    no: "007", status: "Reopened", priority: "Urgent", assigned: true,
    summary: "Lab 4 seed: Reopened ticket without actions", actions: [],
  },
  {
    no: "008", status: "Cancelled", priority: "Medium", assigned: false,
    summary: "Lab 4 seed: Cancelled ticket without actions", actions: [],
  },
] as const;

async function main() {
  const prisma = getPrisma();

  try {
    const requester = await prisma.developmentRequester.findUnique({
      where: { email: "anan.chaiyasit@example.com" },
    });
    const requesterUser = await prisma.user.findUnique({
      where: { email: "anan.chaiyasit@example.com" },
    });
    const staff = await prisma.user.findUnique({
      where: { email: "somchai.staff@example.com" },
    });
    const category = await prisma.category.findUnique({
      where: { name: "Software" },
    });
    const relatedSystem = await prisma.relatedSystem.findUnique({
      where: { name: "Campus Wi-Fi" },
    });

    if (!requester || !requesterUser || !staff || !category || !relatedSystem) {
      throw new Error(
        "Required Lab 3 seed records are missing. Run the existing Lab 3 seed first."
      );
    }

    for (const fixture of fixtures) {
     const clientRequestId = `lab4-seed-client-${fixture.no}`;

let ticket = await prisma.ticket.findUnique({
  where: { clientRequestId },
});

if (!ticket) {
  let ticketNo = `LAB4-FIXTURE-${fixture.no}`;
  let suffix = 0;

  while (await prisma.ticket.findUnique({ where: { ticketNo } })) {
    suffix++;
    ticketNo = `LAB4-FIXTURE-${fixture.no}-${suffix}`;
  }

  ticket = await prisma.ticket.create({
    data: {
      ticketNo,
      clientRequestId,
      requesterId: requester.id,
      requesterUserId: requesterUser.id,
      assignedToUserId: fixture.assigned ? staff.id : null,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: fixture.summary,
      description: `Repeatable Lab 4 verification fixture: ${fixture.summary}`,
      requestedPriority: fixture.priority,
      itPriority: fixture.priority,
      status: fixture.status,
    },
  });
}

      for (let index = 0; index < fixture.actions.length; index++) {
        const action = fixture.actions[index];

        await prisma.actionTaken.upsert({
          where: { idempotencyKey: action.key },
          update: {},
          create: {
            ticketId: ticket.id,
            performedByUserId: staff.id,
            actionAt: new Date(
              `2026-10-${20 + Number(fixture.no)}T09:00:00.000Z`
            ),
            description: action.description,
            result: action.result,
            followUpRequired: action.followUpRequired,
            followUpNote: action.followUpNote,
            idempotencyKey: action.key,
          },
        });
      }
    }

    const [ticketCount, actionCount] = await Promise.all([
      prisma.ticket.count(),
      prisma.actionTaken.count(),
    ]);

    console.log("Lab 4 seed fixtures verified.");
    console.log(`Fixture tickets: ${fixtures.length}`);
    console.log(`Total tickets: ${ticketCount}`);
    console.log(`Total Actions Taken: ${actionCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
