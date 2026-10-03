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

const emailPrefix = "staff-detail-";
const ticketPrefix = "STAFF-DETAIL-";

async function cleanupFixtures() {
  clearSessionsForTests();
  const prisma = getPrisma();

  await prisma.ticketAction.deleteMany({
    where: { ticket: { ticketNo: { startsWith: ticketPrefix } } },
  });

  await prisma.ticketComment.deleteMany({
    where: { ticket: { ticketNo: { startsWith: ticketPrefix } } },
  });

  await prisma.internalNote.deleteMany({
    where: { ticket: { ticketNo: { startsWith: ticketPrefix } } },
  });

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

async function createTicket(requesterId: string) {
  const prisma = getPrisma();

  const category = await prisma.category.findFirstOrThrow({
    where: { isActive: true },
  });

  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({
    where: { isActive: true },
  });

  return prisma.ticket.create({
    data: {
      ticketNo: `${ticketPrefix}${randomUUID()}`,
      requesterId,
      requesterUserId: requesterId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "VPN account needs staff investigation",
      description: "Ticket detail fixture.",
      requestedPriority: "High",
      status: "New",
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

describe.sequential("Lab 3 staff ticket detail API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("returns complete staff ticket detail", async () => {
    const requester = await createUser({
      displayName: "Detail Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Detail Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const staffAgent = await signIn(staff.email);

    const response = await staffAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        summary: "VPN account needs staff investigation",
        requestedPriority: "High",
        status: "New",
      })
    );

    expect(response.body.data).toHaveProperty("requester");
    expect(response.body.data).toHaveProperty("comments");
    expect(response.body.data).toHaveProperty("internalNotes");
    expect(response.body.data).toHaveProperty("actions");
  });

  it("includes updated assignment, priority, status, and history", async () => {
    const requester = await createUser({
      displayName: "Detail Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Detail Staff",
      roles: ["ITStaff"],
    });

    const assignee = await createUser({
      displayName: "Second Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const staffAgent = await signIn(staff.email);

    const assignment = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/assignment`)
      .send({ assignedToUserId: assignee.id });

    expect(assignment.status).toBe(200);

    const priority = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/it-priority`)
      .send({ itPriority: "Urgent" });

    expect(priority.status).toBe(200);

    const status = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "InProgress",
        reason: "Started investigation.",
      });

    expect(status.status).toBe(200);

    const detail = await staffAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );

    expect(detail.status).toBe(200);
    expect(detail.body.data).toEqual(
      expect.objectContaining({
        itPriority: "Urgent",
        status: "InProgress",
        assignedTo: expect.objectContaining({
          id: assignee.id,
        }),
      })
    );
  });
});