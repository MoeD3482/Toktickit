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
const ticketPrefix = "LAB4-REQUESTER-DASHBOARD-";
const TEST_PASSWORD = "CurrentPass123";

async function cleanupFixtures() {
  clearSessionsForTests();
  const prisma = getPrisma();
  const ticketWhere = {
    ticket: { ticketNo: { startsWith: ticketPrefix } },
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
  status: TicketStatus,
  updatedAt: Date,
  suffix: string = randomUUID(),
) {
  const prisma = getPrisma();
  const category = await prisma.category.findFirstOrThrow({
    where: { isActive: true },
  });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({
    where: { isActive: true },
  });

  return prisma.ticket.create({
    data: {
      ticketNo: `${ticketPrefix}${suffix}`,
      requesterId,
      requesterUserId: requesterId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: `Dashboard Ticket ${suffix}`,
      description: "Ticket used for Requester Dashboard tests.",
      requestedPriority: "High",
      status,
      clientRequestId: randomUUID(),
      updatedAt,
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

describe.sequential("GET /api/v1/requester/dashboard", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("returns zero metrics and empty concise lists for a Requester with no Tickets", async () => {
    const requester = await createUser({
      displayName: "Empty Dashboard Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const agent = await signIn(requester.email);

    const response = await agent.get("/api/v1/requester/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      openTicketCount: 0,
      waitingForRequesterCount: 0,
      recentlyUpdatedCount: 0,
      recentlyResolvedCount: 0,
      recentTickets: [],
      attentionRequiredTickets: [],
    });
  });

  it("calculates documented metrics, limits recent lists, and returns concise Ticket summaries", async () => {
    const requester = await createUser({
      displayName: "Metrics Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const now = Date.now();
    const hoursAgo = (hours: number) =>
      new Date(now - hours * 60 * 60 * 1000);

    await createTicket(requester.id, "New", hoursAgo(1), "new");
    await createTicket(requester.id, "Open", hoursAgo(2), "open");
    await createTicket(requester.id, "InProgress", hoursAgo(3), "in-progress");
    await createTicket(requester.id, "Reopened", hoursAgo(4), "reopened");

    for (let index = 0; index < 6; index += 1) {
      await createTicket(
        requester.id,
        "WaitingForRequester",
        hoursAgo(5 + index),
        `waiting-${index}`,
      );
    }

    await createTicket(requester.id, "Resolved", hoursAgo(12), "resolved");
    await createTicket(requester.id, "Closed", hoursAgo(13), "closed");
    await createTicket(
      requester.id,
      "Resolved",
      hoursAgo(31 * 24),
      "old-resolved",
    );

    const agent = await signIn(requester.email);
    const response = await agent.get("/api/v1/requester/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.openTicketCount).toBe(10);
    expect(response.body.data.waitingForRequesterCount).toBe(6);
    expect(response.body.data.recentlyUpdatedCount).toBe(5);
    expect(response.body.data.recentlyResolvedCount).toBe(2);
    expect(response.body.data.recentTickets).toHaveLength(5);
    expect(response.body.data.attentionRequiredTickets).toHaveLength(5);
    expect(response.body.data.recentTickets.map((ticket: { ticketNo: string }) => ticket.ticketNo)).toEqual(
      expect.arrayContaining([
        `${ticketPrefix}new`,
        `${ticketPrefix}open`,
      ]),
    );
    expect(response.body.data.recentTickets[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ticketNo: expect.any(String),
        summary: expect.any(String),
        requestedPriority: "High",
        status: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(response.body.data.recentTickets[0].requesterUserId).toBeUndefined();
    expect(response.body.data.recentTickets[0].internalNotes).toBeUndefined();
  });

  it("isolates all metrics and Ticket summaries to the authenticated Requester", async () => {
    const requester = await createUser({
      displayName: "Owner Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const otherRequester = await createUser({
      displayName: "Other Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const ownedTicket = await createTicket(
      requester.id,
      "New",
      new Date(),
      "owned",
    );
    await createTicket(
      otherRequester.id,
      "WaitingForRequester",
      new Date(),
      "other-private",
    );

    const agent = await signIn(requester.email);
    const response = await agent.get("/api/v1/requester/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.openTicketCount).toBe(1);
    expect(response.body.data.waitingForRequesterCount).toBe(0);
    expect(response.body.data.recentTickets.map((ticket: { id: string }) => ticket.id)).toEqual([
      ownedTicket.id,
    ]);
    expect(response.body.data.attentionRequiredTickets).toEqual([]);
  });

  it("supports the dashboard's multi-status and recent-update My Tickets drill-down filters", async () => {
    const requester = await createUser({
      displayName: "Drill-down Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const now = Date.now();
    const openTicket = await createTicket(
      requester.id,
      "Open",
      new Date(now - 60 * 60 * 1000),
      "drill-open",
    );
    const waitingTicket = await createTicket(
      requester.id,
      "WaitingForRequester",
      new Date(now - 2 * 60 * 60 * 1000),
      "drill-waiting",
    );
    await createTicket(
      requester.id,
      "Resolved",
      new Date(now - 3 * 60 * 60 * 1000),
      "drill-resolved",
    );
    await createTicket(
      requester.id,
      "Open",
      new Date(now - 31 * 24 * 60 * 60 * 1000),
      "drill-old",
    );

    const agent = await signIn(requester.email);
    const response = await agent.get(
      "/api/v1/tickets?status=Open,WaitingForRequester&updatedWithinDays=30",
    );

    expect(response.status).toBe(200);
    expect(response.body.meta.totalItems).toBe(2);
    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      openTicket.id,
      waitingTicket.id,
    ]);
  });

  it("requires an authenticated Requester", async () => {
    const anonymous = await request(app).get("/api/v1/requester/dashboard");
    expect(anonymous.status).toBe(401);

    const staff = await createUser({
      displayName: "Dashboard Staff",
      roles: ["ITStaff"],
    });
    const staffAgent = await signIn(staff.email);
    const forbidden = await staffAgent.get("/api/v1/requester/dashboard");
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");
  });
});
