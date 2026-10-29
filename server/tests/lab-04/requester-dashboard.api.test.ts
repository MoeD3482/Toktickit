import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import type { TicketStatus, UserRole } from "@prisma/client";
import { app } from "../../src/app.js";
import { hashPassword } from "../../src/auth/password.js";
import { clearSessionsForTests } from "../../src/auth/session.js";
import { getPrisma } from "../../src/prisma.js";

const emailPrefix = "lab4-requester-dashboard-";
const ticketPrefix = "LAB4-DASH-";
const TEST_PASSWORD = "CurrentPass123";
const DAY_MS = 24 * 60 * 60 * 1000;

async function cleanupFixtures() {
  clearSessionsForTests();

  const prisma = getPrisma();
  const ticketWhere = {
    ticket: {
      ticketNo: { startsWith: ticketPrefix },
    },
  };

  await prisma.actionTaken.deleteMany({ where: ticketWhere });
  await prisma.ticketAction.deleteMany({ where: ticketWhere });
  await prisma.ticketComment.deleteMany({ where: ticketWhere });
  await prisma.internalNote.deleteMany({ where: ticketWhere });

  await prisma.ticket.deleteMany({
    where: { ticketNo: { startsWith: ticketPrefix } },
  });

  await prisma.developmentRequester.deleteMany({
    where: { email: { startsWith: emailPrefix } },
  });

  await prisma.user.deleteMany({
    where: { email: { startsWith: emailPrefix } },
  });
}

async function createUser(options: {
  displayName: string;
  roles: UserRole[];
  requesterProfile?: boolean;
}) {
  const prisma = getPrisma();
  const email = `${emailPrefix}${randomUUID()}@example.com`;

  const user = await prisma.user.create({
    data: {
      displayName: options.displayName,
      email,
      passwordHash: await hashPassword(TEST_PASSWORD),
      roles: options.roles,
      isActive: true,
      passwordState: "Active",
    },
  });

  if (options.requesterProfile) {
    await prisma.developmentRequester.create({
      data: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        isActive: true,
      },
    });
  }

  return user;
}

async function createTicket(
  requesterId: string,
  options: {
    status?: TicketStatus;
    daysAgo?: number;
    summary?: string;
  } = {},
) {
  const prisma = getPrisma();

  const category = await prisma.category.findFirstOrThrow({
    where: { isActive: true },
  });

  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({
    where: { isActive: true },
  });

  const daysAgo = options.daysAgo ?? 1;

  return prisma.ticket.create({
    data: {
      ticketNo: `${ticketPrefix}${randomUUID()}`,
      requesterId,
      requesterUserId: requesterId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: options.summary ?? "Requester Dashboard test ticket",
      description: "Fixture for Requester Dashboard API tests.",
      requestedPriority: "High",
      status: options.status ?? "New",
      clientRequestId: randomUUID(),
      updatedAt: new Date(Date.now() - daysAgo * DAY_MS),
    },
  });
}

async function signIn(email: string) {
  const agent = request.agent(app);

  const response = await agent.post("/api/v1/auth/login").send({
    email,
    password: TEST_PASSWORD,
  });

  expect(response.status).toBe(200);
  return agent;
}

describe.sequential("Lab 4 Requester Dashboard API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("requires authentication", async () => {
    const response = await request(app).get(
      "/api/v1/requester/dashboard",
    );

    expect(response.status).toBe(401);
  });

  it("calculates dashboard metrics and returns only the signed-in Requester's tickets", async () => {
    const requester = await createUser({
      displayName: "Dashboard Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const otherRequester = await createUser({
      displayName: "Other Dashboard Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const newTicket = await createTicket(requester.id, {
      status: "New",
      daysAgo: 1,
    });

    const inProgressTicket = await createTicket(requester.id, {
      status: "InProgress",
      daysAgo: 2,
    });

    const waitingTicket = await createTicket(requester.id, {
      status: "WaitingForRequester",
      daysAgo: 3,
    });

    const reopenedTicket = await createTicket(requester.id, {
      status: "Reopened",
      daysAgo: 4,
    });

    const resolvedTicket = await createTicket(requester.id, {
      status: "Resolved",
      daysAgo: 5,
    });

    const closedTicket = await createTicket(requester.id, {
      status: "Closed",
      daysAgo: 6,
    });

    await createTicket(requester.id, {
      status: "Cancelled",
      daysAgo: 7,
    });

    await createTicket(requester.id, {
      status: "Resolved",
      daysAgo: 40,
    });

    const otherUsersTicket = await createTicket(otherRequester.id, {
      status: "New",
      daysAgo: 1,
    });

    const agent = await signIn(requester.email);
    const response = await agent.get("/api/v1/requester/dashboard");

    expect(response.status).toBe(200);

    const dashboard = response.body.data;

    expect(dashboard.openTicketCount).toBe(4);
    expect(dashboard.waitingForRequesterCount).toBe(1);
    expect(dashboard.recentlyUpdatedCount).toBe(7);
    expect(dashboard.recentlyResolvedCount).toBe(2);

    expect(dashboard.recentTickets).toHaveLength(5);
    expect(
      dashboard.recentTickets.map(
        (ticket: { ticketNo: string }) => ticket.ticketNo,
      ),
    ).toEqual([
      newTicket.ticketNo,
      inProgressTicket.ticketNo,
      waitingTicket.ticketNo,
      reopenedTicket.ticketNo,
      resolvedTicket.ticketNo,
    ]);

    expect(
      dashboard.attentionRequiredTickets.map(
        (ticket: { ticketNo: string }) => ticket.ticketNo,
      ),
    ).toEqual([waitingTicket.ticketNo]);

    const returnedTicketNumbers = [
      ...dashboard.recentTickets.map(
        (ticket: { ticketNo: string }) => ticket.ticketNo,
      ),
      ...dashboard.attentionRequiredTickets.map(
        (ticket: { ticketNo: string }) => ticket.ticketNo,
      ),
    ];

    expect(returnedTicketNumbers).not.toContain(
      otherUsersTicket.ticketNo,
    );
  });
});