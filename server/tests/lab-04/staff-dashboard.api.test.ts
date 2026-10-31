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

const emailPrefix = "lab4-staff-dashboard-";
const ticketPrefix = "LAB4-STAFF-DASHBOARD-";
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
  suffix: string,
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
      summary: `Staff Dashboard Ticket ${suffix}`,
      description: "Ticket used for Staff Dashboard tests.",
      requestedPriority: "High",
      status,
      clientRequestId: randomUUID(),
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

describe.sequential("GET /api/v1/staff/dashboard", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

    it("returns dashboard metrics and concise lists for a Staff user", async () => {
    const staff = await createUser({
      displayName: "Empty Dashboard Staff",
      roles: ["ITStaff"],
    });
    const agent = await signIn(staff.email);

    const response = await agent.get("/api/v1/staff/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      unassignedTicketCount: expect.any(Number),
      ownedByCurrentUserCount: 0,
      statusCounts: expect.any(Object),
      priorityCounts: expect.any(Object),
      recentTickets: expect.any(Array),
      urgentTickets: expect.any(Array),
    });
  });

  it("calculates unassigned, owned, status, and priority metrics", async () => {
    const staff = await createUser({
      displayName: "Metrics Staff",
      roles: ["ITStaff"],
    });
    const requester = await createUser({
      displayName: "Metrics Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const unassigned = await createTicket(requester.id, "New", "unassigned");
    const owned = await createTicket(requester.id, "Open", "owned");
    const resolved = await createTicket(requester.id, "Resolved", "resolved");

    const prisma = getPrisma();

    await prisma.ticket.update({
      where: { id: owned.id },
      data: {
        assignedToUserId: staff.id,
        itPriority: "Urgent",
      },
    });

    await prisma.ticket.update({
      where: { id: unassigned.id },
      data: { itPriority: "High" },
    });

    await prisma.ticket.update({
      where: { id: resolved.id },
      data: { itPriority: "Low" },
    });

    const agent = await signIn(staff.email);
    const response = await agent.get("/api/v1/staff/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.unassignedTicketCount).toBeGreaterThanOrEqual(1);
expect(response.body.data.ownedByCurrentUserCount).toBe(1);
expect(response.body.data.statusCounts.New).toBeGreaterThanOrEqual(1);
expect(response.body.data.statusCounts.Open).toBeGreaterThanOrEqual(1);
expect(response.body.data.priorityCounts.High).toBeGreaterThanOrEqual(1);
expect(response.body.data.priorityCounts.Urgent).toBeGreaterThanOrEqual(1);
expect(
  response.body.data.urgentTickets.some(
    (ticket: { id: string }) => ticket.id === owned.id,
  ),
).toBe(true);
  });

  it("isolates owned-ticket count to the authenticated Staff user", async () => {
    const staff = await createUser({
      displayName: "Current Staff",
      roles: ["ITStaff"],
    });
    const otherStaff = await createUser({
      displayName: "Other Staff",
      roles: ["ITStaff"],
    });
    const requester = await createUser({
      displayName: "Ownership Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const otherTicket = await createTicket(
      requester.id,
      "InProgress",
      "other-owner",
    );

    await getPrisma().ticket.update({
      where: { id: otherTicket.id },
      data: { assignedToUserId: otherStaff.id },
    });

    const agent = await signIn(staff.email);
    const response = await agent.get("/api/v1/staff/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data.ownedByCurrentUserCount).toBe(0);
  });

  it("allows an Administrator to access the Staff Dashboard", async () => {
    const admin = await createUser({
      displayName: "Dashboard Administrator",
      roles: ["Administrator"],
    });
    const agent = await signIn(admin.email);

    const response = await agent.get("/api/v1/staff/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("unassignedTicketCount");
  });

  it("requires authentication and denies Requesters", async () => {
    const anonymous = await request(app).get(
      "/api/v1/staff/dashboard",
    );

    expect(anonymous.status).toBe(401);

    const requester = await createUser({
      displayName: "Forbidden Dashboard Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const agent = await signIn(requester.email);

    const response = await agent.get("/api/v1/staff/dashboard");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});