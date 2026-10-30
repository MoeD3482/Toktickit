import {
  ITPriority,
  RequestedPriority,
  TicketStatus,
} from "@prisma/client";

import { hashPassword } from "../src/auth/password.js";
import { getPrisma } from "../src/prisma.js";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const relatedSystems = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Printer",
  "Corporate Laptop",
];

const requesters = [
  {
    displayName: "Anan Chaiyasit",
    email: "anan.chaiyasit@example.com",
    isActive: true,
  },
  {
    displayName: "Narin Kittipong",
    email: "narin.kittipong@example.com",
    isActive: true,
  },
  {
    displayName: "Pimchanok Srisuk",
    email: "pimchanok.srisuk@example.com",
    isActive: true,
  },
  {
    displayName: "Thanawat Rattanakul",
    email: "thanawat.rattanakul@example.com",
    isActive: true,
  },
  {
    displayName: "Inactive Requester",
    email: "inactive.requester@example.com",
    isActive: false,
  },
];

const staffUsers = [
  {
    displayName: "Somchai IT Staff",
    email: "somchai.staff@example.com",
    roles: ["ITStaff"] as const,
    isActive: true,
  },
  {
    displayName: "Kanya Service Desk",
    email: "kanya.staff@example.com",
    roles: ["ITStaff"] as const,
    isActive: true,
  },
];

const administratorUsers = [
  {
    displayName: "TokTickIT Administrator",
    email: "admin@example.com",
    roles: ["Administrator"] as const,
    isActive: true,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

interface SeedTicketFixture {
  ticketNo: string;
  clientRequestId: string;
  requesterEmail: string;
  assignedToEmail: string | null;
  categoryName: string;
  relatedSystemName: string;
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  itPriority: ITPriority | null;
  status: TicketStatus;
  createdDaysAgo: number;
  updatedDaysAgo: number;
}

interface SeedActionTakenFixture {
  id: string;
  ticketNo: string;
  performedByEmail: string;
  actionDaysAgo: number;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
}

/*
 * Stable Ticket fixtures.
 *
 * Existing Ticket records are never deleted.
 * Only records with these exact ticket numbers are updated.
 */
const ticketFixtures: SeedTicketFixture[] = [
  {
    ticketNo: "LAB4-SEED-001",
    clientRequestId: "00000000-0000-4000-8000-000000000101",
    requesterEmail: "anan.chaiyasit@example.com",
    assignedToEmail: null,
    categoryName: "Network",
    relatedSystemName: "Campus Wi-Fi",
    summary: "Campus Wi-Fi connection problem",
    description:
      "Requester cannot connect to the campus Wi-Fi network.",
    requestedPriority: "Medium",
    itPriority: null,
    status: "New",
    createdDaysAgo: 2,
    updatedDaysAgo: 1,
  },
  {
    ticketNo: "LAB4-SEED-002",
    clientRequestId: "00000000-0000-4000-8000-000000000102",
    requesterEmail: "narin.kittipong@example.com",
    assignedToEmail: "somchai.staff@example.com",
    categoryName: "Account and Access",
    relatedSystemName: "VPN",
    summary: "VPN access troubleshooting",
    description:
      "Requester cannot establish a VPN connection.",
    requestedPriority: "High",
    itPriority: "High",
    status: "InProgress",
    createdDaysAgo: 5,
    updatedDaysAgo: 1,
  },
  {
    ticketNo: "LAB4-SEED-003",
    clientRequestId: "00000000-0000-4000-8000-000000000103",
    requesterEmail: "pimchanok.srisuk@example.com",
    assignedToEmail: "kanya.staff@example.com",
    categoryName: "Software",
    relatedSystemName: "LEB2 App",
    summary: "LEB2 application cannot open",
    description:
      "Requester experiences an application startup problem.",
    requestedPriority: "Urgent",
    itPriority: "Urgent",
    status: "WaitingForRequester",
    createdDaysAgo: 6,
    updatedDaysAgo: 1,
  },
  {
    ticketNo: "LAB4-SEED-004",
    clientRequestId: "00000000-0000-4000-8000-000000000104",
    requesterEmail: "thanawat.rattanakul@example.com",
    assignedToEmail: "somchai.staff@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Corporate Laptop",
    summary: "Laptop performance issue",
    description:
      "Laptop performance improved after troubleshooting.",
    requestedPriority: "High",
    itPriority: "Medium",
    status: "Resolved",
    createdDaysAgo: 8,
    updatedDaysAgo: 2,
  },
  {
    ticketNo: "LAB4-SEED-005",
    clientRequestId: "00000000-0000-4000-8000-000000000105",
    requesterEmail: "anan.chaiyasit@example.com",
    assignedToEmail: "kanya.staff@example.com",
    categoryName: "Account and Access",
    relatedSystemName: "Email",
    summary: "Email account access restored",
    description:
      "Email access was restored and verified.",
    requestedPriority: "Medium",
    itPriority: "Low",
    status: "Closed",
    createdDaysAgo: 12,
    updatedDaysAgo: 3,
  },
  {
    ticketNo: "LAB4-SEED-006",
    clientRequestId: "00000000-0000-4000-8000-000000000106",
    requesterEmail: "narin.kittipong@example.com",
    assignedToEmail: "somchai.staff@example.com",
    categoryName: "Software",
    relatedSystemName: "Grade Submission App",
    summary: "Grade submission application issue",
    description:
      "The Ticket was reopened for additional investigation.",
    requestedPriority: "High",
    itPriority: "High",
    status: "Reopened",
    createdDaysAgo: 14,
    updatedDaysAgo: 1,
  },
  {
    ticketNo: "LAB4-SEED-007",
    clientRequestId: "00000000-0000-4000-8000-000000000107",
    requesterEmail: "pimchanok.srisuk@example.com",
    assignedToEmail: null,
    categoryName: "Hardware",
    relatedSystemName: "Printer",
    summary: "Printer request cancelled",
    description:
      "The original printer request was cancelled.",
    requestedPriority: "Low",
    itPriority: null,
    status: "Cancelled",
    createdDaysAgo: 18,
    updatedDaysAgo: 4,
  },
];

/*
 * ActionTaken fixtures.
 *
 * 001: zero Actions Taken.
 * 002: one Action Taken.
 * 003: multiple Actions Taken, with follow-up required.
 * 004: one completed Action Taken, suitable for resolution.
 * 005: multiple Actions Taken.
 * 006: one Action Taken.
 * 007: zero Actions Taken.
 */
const actionFixtures: SeedActionTakenFixture[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    ticketNo: "LAB4-SEED-002",
    performedByEmail: "somchai.staff@example.com",
    actionDaysAgo: 1.5,
    description: "Checked VPN connection settings",
    result:
      "VPN configuration was reviewed. Further investigation is required.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    ticketNo: "LAB4-SEED-003",
    performedByEmail: "somchai.staff@example.com",
    actionDaysAgo: 4,
    description: "Reviewed application error logs",
    result:
      "An application configuration problem was identified.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "Application log screenshot.",
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    ticketNo: "LAB4-SEED-003",
    performedByEmail: "kanya.staff@example.com",
    actionDaysAgo: 1,
    description: "Requested additional verification",
    result:
      "Waiting for the Requester to verify the application behavior.",
    followUpRequired: true,
    followUpNote:
      "Please confirm whether the application opens successfully.",
    attachmentNotes: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    ticketNo: "LAB4-SEED-004",
    performedByEmail: "somchai.staff@example.com",
    actionDaysAgo: 2,
    description: "Checked laptop performance",
    result:
      "Performance issue was resolved and verified.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "Performance test screenshot.",
  },
  {
    id: "00000000-0000-4000-8000-000000000205",
    ticketNo: "LAB4-SEED-005",
    performedByEmail: "somchai.staff@example.com",
    actionDaysAgo: 5,
    description: "Investigated email account access",
    result:
      "Identified the cause of the account access problem.",
    followUpRequired: true,
    followUpNote:
      "Verify that the Requester can sign in.",
    attachmentNotes: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000206",
    ticketNo: "LAB4-SEED-005",
    performedByEmail: "kanya.staff@example.com",
    actionDaysAgo: 3,
    description: "Verified restored email access",
    result:
      "Requester email access was successfully restored.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "Email verification screenshot.",
  },
  {
    id: "00000000-0000-4000-8000-000000000207",
    ticketNo: "LAB4-SEED-006",
    performedByEmail: "somchai.staff@example.com",
    actionDaysAgo: 1,
    description: "Rechecked application submission",
    result:
      "Additional investigation is in progress.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
];

async function main() {
  const prisma = getPrisma();

  const now = new Date();

  const temporaryPasswordHash = await hashPassword(
    "ChangeMe123!",
  );

  const requesterRecords = new Map<
    string,
    {
      requesterId: string;
      requesterUserId: string;
    }
  >();

  const staffRecords = new Map<string, string>();

  const categoryIds = new Map<string, number>();
  const relatedSystemIds = new Map<string, string>();

  const ticketIds = new Map<string, string>();

  // ---------------------------------------------------------
  // 1. Categories
  // ---------------------------------------------------------

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        isActive: true,
      },
    });

    const category = await prisma.category.findUniqueOrThrow({
      where: { name },
    });

    categoryIds.set(name, category.id);
  }

  // ---------------------------------------------------------
  // 2. Related Systems
  // ---------------------------------------------------------

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        isActive: true,
      },
    });

    const relatedSystem =
      await prisma.relatedSystem.findUniqueOrThrow({
        where: { name },
      });

    relatedSystemIds.set(name, relatedSystem.id);
  }

  // ---------------------------------------------------------
  // 3. Requesters
  // ---------------------------------------------------------

  for (const requester of requesters) {
    const developmentRequester =
      await prisma.developmentRequester.upsert({
        where: { email: requester.email },
        update: {
          displayName: requester.displayName,
          isActive: requester.isActive,
        },
        create: requester,
      });

    // Preserve an existing user's password and password state.
    const user = await prisma.user.upsert({
      where: { email: requester.email },
      update: {
        displayName: requester.displayName,
        roles: ["Requester"],
        isActive: requester.isActive,
      },
      create: {
        id: developmentRequester.id,
        displayName: requester.displayName,
        email: requester.email,
        passwordHash: temporaryPasswordHash,
        roles: ["Requester"],
        isActive: requester.isActive,
        passwordState: "ChangeRequired",
      },
    });

    requesterRecords.set(requester.email, {
      requesterId: developmentRequester.id,
      requesterUserId: user.id,
    });
  }

  // ---------------------------------------------------------
  // 4. IT Staff
  // ---------------------------------------------------------

  for (const staffUser of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: staffUser.email },
      update: {
        displayName: staffUser.displayName,
        roles: [...staffUser.roles],
        isActive: staffUser.isActive,
      },
      create: {
        displayName: staffUser.displayName,
        email: staffUser.email,
        passwordHash: temporaryPasswordHash,
        roles: [...staffUser.roles],
        isActive: staffUser.isActive,
        passwordState: "ChangeRequired",
      },
    });

    staffRecords.set(staffUser.email, user.id);
  }

  // ---------------------------------------------------------
  // 5. Administrators
  // ---------------------------------------------------------

  for (const administratorUser of administratorUsers) {
    await prisma.user.upsert({
      where: { email: administratorUser.email },
      update: {
        displayName: administratorUser.displayName,
        roles: [...administratorUser.roles],
        isActive: administratorUser.isActive,
      },
      create: {
        displayName: administratorUser.displayName,
        email: administratorUser.email,
        passwordHash: temporaryPasswordHash,
        roles: [...administratorUser.roles],
        isActive: administratorUser.isActive,
        passwordState: "ChangeRequired",
      },
    });
  }

  // ---------------------------------------------------------
  // 6. Tickets
  // ---------------------------------------------------------

  for (const fixture of ticketFixtures) {
    const requester = requesterRecords.get(
      fixture.requesterEmail,
    );

    if (!requester) {
      throw new Error(
        `Requester not found: ${fixture.requesterEmail}`,
      );
    }

    const categoryId = categoryIds.get(
      fixture.categoryName,
    );

    if (categoryId === undefined) {
      throw new Error(
        `Category not found: ${fixture.categoryName}`,
      );
    }

    const relatedSystemId = relatedSystemIds.get(
      fixture.relatedSystemName,
    );

    if (!relatedSystemId) {
      throw new Error(
        `Related System not found: ${fixture.relatedSystemName}`,
      );
    }

    const assignedToUserId =
      fixture.assignedToEmail === null
        ? null
        : staffRecords.get(fixture.assignedToEmail);

    if (
      fixture.assignedToEmail !== null &&
      !assignedToUserId
    ) {
      throw new Error(
        `Staff user not found: ${fixture.assignedToEmail}`,
      );
    }

    const createdAt = daysAgo(
      fixture.createdDaysAgo,
      now,
    );

    const updatedAt = daysAgo(
      fixture.updatedDaysAgo,
      now,
    );

    const ticket = await prisma.ticket.upsert({
      where: {
        ticketNo: fixture.ticketNo,
      },
      update: {
        requesterId: requester.requesterId,
        requesterUserId: requester.requesterUserId,
        assignedToUserId,
        categoryId,
        relatedSystemId,
        summary: fixture.summary,
        description: fixture.description,
        requestedPriority: fixture.requestedPriority,
        itPriority: fixture.itPriority,
        status: fixture.status,
        clientRequestId: fixture.clientRequestId,
        updatedAt,
      },
      create: {
        ticketNo: fixture.ticketNo,
        requesterId: requester.requesterId,
        requesterUserId: requester.requesterUserId,
        assignedToUserId,
        categoryId,
        relatedSystemId,
        summary: fixture.summary,
        description: fixture.description,
        requestedPriority: fixture.requestedPriority,
        itPriority: fixture.itPriority,
        status: fixture.status,
        clientRequestId: fixture.clientRequestId,
        createdAt,
        updatedAt,
      },
    });

    ticketIds.set(fixture.ticketNo, ticket.id);
  }

  // ---------------------------------------------------------
  // 7. Actions Taken
  // ---------------------------------------------------------

  for (const fixture of actionFixtures) {
    const ticketId = ticketIds.get(fixture.ticketNo);

    if (!ticketId) {
      throw new Error(
        `Ticket not found for ActionTaken: ${fixture.ticketNo}`,
      );
    }

    const performedByUserId = staffRecords.get(
      fixture.performedByEmail,
    );

    if (!performedByUserId) {
      throw new Error(
        `Action performer not found: ${fixture.performedByEmail}`,
      );
    }

    const actionAt = daysAgo(
      fixture.actionDaysAgo,
      now,
    );

    await prisma.actionTaken.upsert({
      where: {
        id: fixture.id,
      },
      update: {
        ticketId,
        performedByUserId,
        actionAt,
        description: fixture.description,
        result: fixture.result,
        followUpRequired: fixture.followUpRequired,
        followUpNote: fixture.followUpNote,
        attachmentNotes: fixture.attachmentNotes,
      },
      create: {
        id: fixture.id,
        ticketId,
        performedByUserId,
        actionAt,
        description: fixture.description,
        result: fixture.result,
        followUpRequired: fixture.followUpRequired,
        followUpNote: fixture.followUpNote,
        attachmentNotes: fixture.attachmentNotes,
      },
    });
  }

  // ---------------------------------------------------------
  // 8. Summary
  // ---------------------------------------------------------

  const seededActionCount =
    await prisma.actionTaken.count({
      where: {
        id: {
          in: actionFixtures.map((action) => action.id),
        },
      },
    });

  const seededTicketCount =
    await prisma.ticket.count({
      where: {
        ticketNo: {
          in: ticketFixtures.map(
            (ticket) => ticket.ticketNo,
          ),
        },
      },
    });

  console.log("Lab 4 seed data created successfully.");
  console.log(`Seeded Tickets: ${seededTicketCount}`);
  console.log(`Seeded Actions Taken: ${seededActionCount}`);
  console.log("Ticket scenarios:");
  console.log("- Zero Actions Taken: 2 Tickets");
  console.log("- One Action Taken: 3 Tickets");
  console.log("- Multiple Actions Taken: 2 Tickets");
  console.log("- Assigned and unassigned Tickets included.");
  console.log("Existing Ticket and ActionTaken records were preserved.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });