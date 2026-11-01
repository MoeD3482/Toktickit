
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

const emailPrefix = "lab4-resolution-";
const ticketPrefix = "LAB4-RESOLUTION-";
const TEST_PASSWORD = "CurrentPass123";

async function cleanupFixtures() {
  clearSessionsForTests();

  const prisma = getPrisma();

  const ticketWhere = {
    ticket: {
      ticketNo: {
        startsWith: ticketPrefix,
      },
    },
  };

  await prisma.actionTaken.deleteMany({ where: ticketWhere });
  await prisma.ticketAction.deleteMany({ where: ticketWhere });
  await prisma.ticketComment.deleteMany({ where: ticketWhere });
  await prisma.internalNote.deleteMany({ where: ticketWhere });

  await prisma.ticket.deleteMany({
    where: {
      ticketNo: {
        startsWith: ticketPrefix,
      },
    },
  });

  await prisma.developmentRequester.deleteMany({
    where: {
      email: {
        startsWith: emailPrefix,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: emailPrefix,
      },
    },
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
      summary: "Resolution gate test ticket",
      description: "Ticket used to test resolution requirements.",
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
    password: TEST_PASSWORD,
  });

  expect(response.status).toBe(200);

  return agent;
}

// Fetch the latest updatedAt before every status transition.
async function updateTicketStatus(
  agent: ReturnType<typeof request.agent>,
  ticketId: string,
  status: string,
  reason = ""
) {
  const ticket = await getPrisma().ticket.findUniqueOrThrow({
    where: {
      id: ticketId,
    },
    select: {
      updatedAt: true,
    },
  });

  return agent
    .patch(`/api/v1/staff/tickets/${ticketId}/status`)
    .send({
      status,
      reason,
      expectedUpdatedAt: ticket.updatedAt.toISOString(),
    });
}

// Approved workflow: New -> Open -> InProgress.
async function moveToInProgress(
  agent: ReturnType<typeof request.agent>,
  ticketId: string
) {
  const openResponse = await updateTicketStatus(
    agent,
    ticketId,
    "Open"
  );

  expect(openResponse.status).toBe(200);
  expect(openResponse.body.data.status).toBe("Open");

  const response = await updateTicketStatus(
    agent,
    ticketId,
    "InProgress"
  );

  expect(response.status).toBe(200);
  expect(response.body.data.status).toBe("InProgress");
}

async function resolveTicket(
  agent: ReturnType<typeof request.agent>,
  ticketId: string
) {
  return updateTicketStatus(
    agent,
    ticketId,
    "Resolved"
  );
}

describe.sequential("Lab 4 Ticket resolution gate", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("rejects resolution when no Action Taken exists", async () => {
    const requester = await createUser({
      displayName: "No Action Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "No Action Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    await moveToInProgress(agent, ticket.id);

    const response = await resolveTicket(agent, ticket.id);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(response.body.error.fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "status",
          message: expect.stringContaining("Action Taken"),
        }),
      ])
    );

    const savedTicket = await getPrisma().ticket.findUniqueOrThrow({
      where: {
        id: ticket.id,
      },
    });

    expect(savedTicket.status).toBe("InProgress");
  });

  it("rejects resolution when the latest Action Taken requires follow-up", async () => {
    const requester = await createUser({
      displayName: "Follow-up Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Follow-up Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date(),
        description: "Investigated the issue",
        result: "Restart verification is still needed",
        followUpRequired: true,
        followUpNote: "Verify after restart",
      },
    });

    const agent = await signIn(staff.email);

    await moveToInProgress(agent, ticket.id);

    const response = await resolveTicket(agent, ticket.id);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(response.body.error.fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "status",
          message: expect.stringContaining("follow-up"),
        }),
      ])
    );

    const savedTicket = await getPrisma().ticket.findUniqueOrThrow({
      where: {
        id: ticket.id,
      },
    });

    expect(savedTicket.status).toBe("InProgress");
  });

  it("allows resolution when an Action Taken exists and no follow-up is required", async () => {
    const requester = await createUser({
      displayName: "Ready Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Ready Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date(),
        description: "Resolved the reported issue",
        result: "Service restored and verified",
        followUpRequired: false,
      },
    });

    const agent = await signIn(staff.email);

    await moveToInProgress(agent, ticket.id);

    const response = await resolveTicket(agent, ticket.id);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("Resolved");
    expect(response.body.data.updatedAt).toBeDefined();

    const savedTicket = await getPrisma().ticket.findUniqueOrThrow({
      where: {
        id: ticket.id,
      },
    });

    expect(savedTicket.status).toBe("Resolved");
  });
    it("allows an Administrator to perform a formal status transition", async () => {
    const requester = await createUser({
      displayName: "Admin Workflow Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const admin = await createUser({
      displayName: "Workflow Administrator",
      roles: ["Administrator"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(admin.email);

    const response = await updateTicketStatus(
      agent,
      ticket.id,
      "Open"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("Open");
  });

  it("returns 409 when a status update uses a stale timestamp", async () => {
    const requester = await createUser({
      displayName: "Stale Workflow Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Stale Workflow Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const originalUpdatedAt = ticket.updatedAt.toISOString();

    const firstUpdate = await agent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "Open",
        expectedUpdatedAt: originalUpdatedAt,
      });

    expect(firstUpdate.status).toBe(200);

    const staleUpdate = await agent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "Cancelled",
        expectedUpdatedAt: originalUpdatedAt,
      });

    expect(staleUpdate.status).toBe(409);
    expect(staleUpdate.body.error.code).toBe(
      "TICKET_STATUS_CONFLICT"
    );

    const savedTicket = await getPrisma().ticket.findUniqueOrThrow({
      where: { id: ticket.id },
    });

    expect(savedTicket.status).toBe("Open");

    const historyCount = await getPrisma().ticketAction.count({
      where: {
        ticketId: ticket.id,
        actionType: "StatusChanged",
      },
    });

    expect(historyCount).toBe(1);
  });

  it("enforces every permitted and rejected status transition", async () => {
    const prisma = getPrisma();

    const requester = await createUser({
      displayName: "Matrix Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Matrix Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    await prisma.actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date(),
        description: "Completed verification",
        result: "Service restored",
        followUpRequired: false,
      },
    });

    const statuses = [
      "New",
      "Open",
      "InProgress",
      "WaitingForRequester",
      "Resolved",
      "Closed",
      "Reopened",
      "Cancelled",
    ] as const;

    type TestStatus = (typeof statuses)[number];

    const transitions: Record<
      TestStatus,
      readonly TestStatus[]
    > = {
      New: ["Open", "Cancelled"],
      Open: ["InProgress", "Cancelled"],
      InProgress: [
        "WaitingForRequester",
        "Resolved",
        "Cancelled",
      ],
      WaitingForRequester: [
        "Open",
        "InProgress",
        "Cancelled",
      ],
      Resolved: ["Closed", "Reopened"],
      Closed: ["Reopened"],
      Reopened: [
        "Open",
        "InProgress",
        "Cancelled",
      ],
      Cancelled: [],
    };

    for (const from of statuses) {
      for (const to of statuses) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: from },
        });

        const historyBefore =
          await prisma.ticketAction.count({
            where: {
              ticketId: ticket.id,
              actionType: "StatusChanged",
            },
          });

        const response = await updateTicketStatus(
          agent,
          ticket.id,
          to
        );

        const permitted = transitions[from].includes(to);

        if (permitted) {
          expect(response.status).toBe(200);
          expect(response.body.data.status).toBe(to);
        } else {
          expect(response.status).toBe(422);
          expect(response.body.error.code).toBe(
            "VALIDATION_ERROR"
          );

          const savedTicket =
            await prisma.ticket.findUniqueOrThrow({
              where: { id: ticket.id },
            });

          expect(savedTicket.status).toBe(from);
        }

        const historyAfter =
          await prisma.ticketAction.count({
            where: {
              ticketId: ticket.id,
              actionType: "StatusChanged",
            },
          });

        expect(historyAfter).toBe(
          historyBefore + (permitted ? 1 : 0)
        );
      }
    }
  }, 30000);

  it("rejects status changes from Requesters", async () => {
    const requester = await createUser({
      displayName: "Forbidden Workflow Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(requester.email);

    const response = await updateTicketStatus(
      agent,
      ticket.id,
      "Open"
    );

    expect(response.status).toBe(403);

    const savedTicket =
      await getPrisma().ticket.findUniqueOrThrow({
        where: { id: ticket.id },
      });

    expect(savedTicket.status).toBe("New");
  });

  it("rejects unauthenticated status changes", async () => {
    const response = await request(app)
      .patch("/api/v1/staff/tickets/unknown-ticket/status")
      .send({ status: "Open" });

    expect(response.status).toBe(401);
  });

  it("validates status, timestamp, and reason fields", async () => {
    const requester = await createUser({
      displayName: "Validation Workflow Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Validation Workflow Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const invalidStatus = await agent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "Unknown",
        expectedUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(invalidStatus.status).toBe(422);

    const missingTimestamp = await agent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({ status: "Open" });

    expect(missingTimestamp.status).toBe(422);

    const invalidReason = await agent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "Open",
        reason: "x".repeat(501),
        expectedUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(invalidReason.status).toBe(422);

    const savedTicket =
      await getPrisma().ticket.findUniqueOrThrow({
        where: { id: ticket.id },
      });

    expect(savedTicket.status).toBe("New");
  });

});
