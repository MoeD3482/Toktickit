
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPrisma } from "../src/prisma.js";

// Load DATABASE_URL from server/.env without displaying credentials.
const envPath = resolve(process.cwd(), ".env");

try {
  const envContent = readFileSync(envPath, "utf8");

  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/
    );

    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // An existing environment variable can still provide DATABASE_URL.
}

const prisma = getPrisma();

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const email = (
      await rl.question("Enter your IT Staff login email: ")
    ).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        displayName: true,
        roles: true,
        isActive: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      (!user.roles.includes("ITStaff") &&
        !user.roles.includes("Administrator"))
    ) {
      throw new Error("Active IT Staff or Administrator account not found.");
    }

    const terminalStatuses = [
      "Resolved",
      "Closed",
      "Cancelled",
    ] as const;

    const activeTicketWhere = {
      status: {
        notIn: [...terminalStatuses],
      },
    };

    const recentBoundary = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const [
      unassignedTicketCount,
      ownedByCurrentUserCount,
      statusGroups,
      priorityGroups,
      recentTickets,
      urgentTickets,
      currentUserActionsTakenCount,
      recentActionsTaken,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          ...activeTicketWhere,
          assignedToUserId: null,
        },
      }),

      prisma.ticket.count({
        where: {
          ...activeTicketWhere,
          assignedToUserId: user.id,
        },
      }),

      prisma.ticket.groupBy({
        by: ["status"],
        where: activeTicketWhere,
        _count: { _all: true },
      }),

      prisma.ticket.groupBy({
        by: ["itPriority"],
        where: {
          ...activeTicketWhere,
          itPriority: { not: null },
        },
        _count: { _all: true },
      }),

      prisma.ticket.findMany({
        where: { updatedAt: { gte: recentBoundary } },
        orderBy: [
          { updatedAt: "desc" },
          { ticketNo: "desc" },
        ],
        take: 5,
        select: {
          ticketNo: true,
          summary: true,
          status: true,
          itPriority: true,
          updatedAt: true,
        },
      }),

      prisma.ticket.findMany({
        where: {
          itPriority: "Urgent",
          ...activeTicketWhere,
        },
        orderBy: [
          { updatedAt: "desc" },
          { ticketNo: "desc" },
        ],
        take: 5,
        select: {
          ticketNo: true,
          summary: true,
          status: true,
          itPriority: true,
          updatedAt: true,
        },
      }),

      prisma.actionTaken.count({
        where: { performedByUserId: user.id },
      }),

      prisma.actionTaken.findMany({
        where: { performedByUserId: user.id },
        orderBy: { actionAt: "desc" },
        take: 5,
        select: {
          actionAt: true,
          description: true,
          result: true,
          ticket: {
            select: { ticketNo: true },
          },
        },
      }),
    ]);

    console.log("\n===== STAFF DASHBOARD DATABASE VERIFICATION =====");
    console.log("Staff:", user.displayName);
    console.log("Active:", user.isActive);

    console.log("\n--- Dashboard Metrics ---");
    console.log("Unassigned Tickets:", unassignedTicketCount);
    console.log("My Active Tickets:", ownedByCurrentUserCount);

    console.log("\n--- Tickets by Status ---");
    console.log(
      Object.fromEntries(
        statusGroups.map((item) => [
          item.status,
          item._count._all,
        ])
      )
    );

    console.log("\n--- Tickets by IT Priority ---");
    console.log(
      Object.fromEntries(
        priorityGroups.map((item) => [
          item.itPriority,
          item._count._all,
        ])
      )
    );

    console.log("\n--- Recently Updated Tickets (Top 5) ---");
    console.table(recentTickets);

    console.log("\n--- Urgent Active Tickets (Top 5) ---");
    console.table(urgentTickets);

    console.log("\n--- Current User Actions Taken ---");
    console.log("Total Actions Taken:", currentUserActionsTakenCount);
    console.table(
      recentActionsTaken.map((action) => ({
        ticketNo: action.ticket.ticketNo,
        actionAt: action.actionAt,
        description: action.description,
        result: action.result,
      }))
    );

    console.log("\n===== VERIFICATION COMPLETED =====");
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("Verification failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
