import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { app } from "../../src/app.js";
import { hashPassword } from "../../src/auth/password.js";
import { clearSessionsForTests } from "../../src/auth/session.js";
import { getPrisma } from "../../src/prisma.js";

const emailPrefix = "staff-queue-";
const ticketPrefix = "STAFF-QUEUE-";

async function cleanupFixtures() {
  clearSessionsForTests();
  const prisma = getPrisma();
  const ticketWhere = {
    ticket: {
      ticketNo: { startsWith: ticketPrefix },
    },
  };

  await prisma.ticketAction.deleteMany({ where: ticketWhere });
  await prisma.ticketComment.deleteMany({ where: ticketWhere });
  await prisma.internalNote.deleteMany({ where: ticketWhere });
  await prisma.attachment.deleteMany({ where: ticketWhere });
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
      passwordHash: await hashPassword("CurrentPass123"),
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

async function createTicket(options: {
  requesterId: string;
  summary: string;
  requestedPriority: "Low" | "Medium" | "High" | "Urgent";
  itPriority?: "Low" | "Medium" | "High" | "Urgent";
  status?: "New" | "InProgress" | "Resolved";
  assignedToUserId?: string;
}) {
  const prisma = getPrisma();
  const [category, relatedSystem] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { isActive: true } }),
    prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
  ]);

  return prisma.ticket.create({
    data: {
      ticketNo: `${ticketPrefix}${randomUUID()}`,
      requesterId: options.requesterId,
      requesterUserId: options.requesterId,
      assignedToUserId: options.assignedToUserId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: options.summary,
      description: "Ticket fixture for staff queue query behavior.",
      requestedPriority: options.requestedPriority,
      itPriority: options.itPriority,
      status: options.status ?? "New",
      clientRequestId: randomUUID(),
    },
  });
}

async function signIn(email: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/v1/auth/login").send({
    email,
    password: "CurrentPass123",
  });

  expect(response.status).toBe(200);
  return agent;
}

describe.sequential("Lab 3 staff queue API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("searches, filters, sorts, and paginates the staff queue", async () => {
    const requester = await createUser({
      displayName: "Queue Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const staff = await createUser({
      displayName: "Queue Staff",
      roles: ["ITStaff"],
    });
    const secondStaff = await createUser({
      displayName: "Other Queue Staff",
      roles: ["ITStaff"],
    });
    const matching = await createTicket({
      requesterId: requester.id,
      summary: "VPN connection fails after password reset",
      requestedPriority: "High",
      itPriority: "Urgent",
      assignedToUserId: secondStaff.id,
    });
    await createTicket({
      requesterId: requester.id,
      summary: "Keyboard replacement request",
      requestedPriority: "Low",
      status: "InProgress",
      assignedToUserId: staff.id,
    });

    const agent = await signIn(staff.email);
    const response = await agent.get("/api/v1/staff/tickets").query({
      search: matching.ticketNo,
      requester: "queue requester",
      requestedPriority: "High",
      itPriority: "Urgent",
      status: "New",
      assignedToUserId: secondStaff.id,
      sort: "ticketNo",
      order: "asc",
      page: 1,
      pageSize: 1,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: matching.id,
        ticketNo: matching.ticketNo,
        itPriority: "Urgent",
        status: "New",
        assignedTo: expect.objectContaining({ id: secondStaff.id }),
      })
    );
    expect(response.body.meta).toEqual({
      page: 1,
      pageSize: 1,
      totalItems: 1,
      totalPages: 1,
    });

    const unassigned = await agent.get("/api/v1/staff/tickets").query({
      assignedToUserId: "unassigned",
    });
    expect(unassigned.status).toBe(200);
    expect(
      unassigned.body.data.every(
        (item: { assignedTo: unknown }) => item.assignedTo === null
      )
    ).toBe(true);
  });

  it("returns structured validation errors for invalid queue parameters", async () => {
    const staff = await createUser({
      displayName: "Validation Staff",
      roles: ["ITStaff"],
    });
    const agent = await signIn(staff.email);

    const response = await agent.get("/api/v1/staff/tickets").query({
      requestedPriority: "Critical",
      page: 0,
      pageSize: 100,
      sort: "summary",
      order: "sideways",
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "requestedPriority" }),
        expect.objectContaining({ field: "page" }),
        expect.objectContaining({ field: "pageSize" }),
        expect.objectContaining({ field: "sort" }),
        expect.objectContaining({ field: "order" }),
      ])
    );
  });

  it("keeps staff queue and assignee data unavailable to Requesters", async () => {
    const requester = await createUser({
      displayName: "Forbidden Queue Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const agent = await signIn(requester.email);

    const [queueResponse, assigneesResponse] = await Promise.all([
      agent.get("/api/v1/staff/tickets"),
      agent.get("/api/v1/staff/assignees"),
    ]);

    for (const response of [queueResponse, assigneesResponse]) {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    }
  });
});
