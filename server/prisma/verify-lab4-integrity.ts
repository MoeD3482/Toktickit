import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  try {
    const [
      users,
      requesters,
      categories,
      systems,
      tickets,
      actions,
      actionRelations,
      ticketRelations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.developmentRequester.count(),
      prisma.category.count(),
      prisma.relatedSystem.count(),
      prisma.ticket.count(),
      prisma.actionTaken.count(),

      prisma.actionTaken.findMany({
        select: {
          ticket: { select: { id: true } },
          performedBy: { select: { id: true } },
        },
      }),

      prisma.ticket.findMany({
        select: {
          requester: { select: { id: true } },
          category: { select: { id: true } },
          relatedSystem: { select: { id: true } },
          assignedTo: { select: { id: true } },
        },
      }),
    ]);

    const actionRelationsValid = actionRelations.every(
      (action) => Boolean(action.ticket.id && action.performedBy.id),
    );

    const ticketRelationsValid = ticketRelations.every(
      (ticket) =>
        Boolean(
          ticket.requester.id &&
          ticket.category.id &&
          ticket.relatedSystem.id,
        ),
    );

    console.table({
      users,
      requesters,
      categories,
      systems,
      tickets,
      actionsTaken: actions,
      actionRelationsValid,
      ticketRelationsValid,
    });

    if (!actionRelationsValid || !ticketRelationsValid) {
      throw new Error("A database relationship check failed.");
    }

    console.log("Read-only database integrity verification passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
