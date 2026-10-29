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

const emailPrefix = "lab4-actions-taken-";
const ticketPrefix = "LAB4-ACTIONS-";
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

  await prisma.actionTaken.deleteMany({
    where: ticketWhere,
  });
  await prisma.ticketAction.deleteMany({
    where: ticketWhere,
  });
  await prisma.ticketComment.deleteMany({
    where: ticketWhere,
  });
  await prisma.internalNote.deleteMany({
    where: ticketWhere,
  });
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

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  return prisma.ticket.create({
    data: {
      ticketNo: `${ticketPrefix}${randomUUID()}`,
      requesterId,
      requesterUserId: requesterId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Lab 4 Actions Taken test ticket",
      description: "Ticket fixture for Actions Taken API tests.",
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

describe.sequential("Lab 4 Actions Taken API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("requires authentication to list Actions Taken", async () => {
    const response = await request(app).get(
      `/api/v1/tickets/${randomUUID()}/actions-taken`,
    );

    expect(response.status).toBe(401);
  });

  it("allows a Requester to read Actions Taken for their own Ticket", async () => {
    const requester = await createUser({
      displayName: "Actions Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Actions Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Checked network settings",
        result: "Network configuration reviewed",
        followUpRequired: false,
      },
    });

    const agent = await signIn(requester.email);
    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}/actions-taken`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        ticketId: ticket.id,
        description: "Checked network settings",
        result: "Network configuration reviewed",
        performedBy: expect.objectContaining({
          id: staff.id,
          displayName: staff.displayName,
        }),
      }),
    );
  });

  it("does not allow a Requester to read another Requester's Ticket actions", async () => {
    const owner = await createUser({
      displayName: "Ticket Owner",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const otherRequester = await createUser({
      displayName: "Other Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const ticket = await createTicket(owner.id);
    const agent = await signIn(otherRequester.email);

    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}/actions-taken`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TICKET_NOT_FOUND");
  });

  it("allows IT Staff to create an Action Taken using their authenticated identity", async () => {
    const requester = await createUser({
      displayName: "Action Owner",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Action Performer",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .send({
        actionAt: "2026-10-29T05:00:00.000Z",
        description: "Checked network settings",
        result: "Network configuration reviewed",
        followUpRequired: true,
        followUpNote: "Verify after restart",
        attachmentNotes: null,
        performedByUserId: requester.id,
      });

    expect(response.status).toBe(201);

    const savedAction =
      await getPrisma().actionTaken.findFirstOrThrow({
        where: {
          ticketId: ticket.id,
          description: "Checked network settings",
        },
      });

    expect(savedAction.performedByUserId).toBe(staff.id);
    expect(savedAction.followUpRequired).toBe(true);
    expect(savedAction.followUpNote).toBe("Verify after restart");
  });

  it("does not allow a Requester to create an Action Taken", async () => {
    const requester = await createUser({
      displayName: "Read Only Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(requester.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .send({
        actionAt: "2026-10-29T05:00:00.000Z",
        description: "Attempted action",
        result: "Attempted result",
        followUpRequired: false,
      });

    expect(response.status).toBe(403);
  });

  it("requires a follow-up note when follow-up is required", async () => {
    const requester = await createUser({
      displayName: "Follow Up Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Follow Up Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .send({
        actionAt: "2026-10-29T05:00:00.000Z",
        description: "Checked network settings",
        result: "Follow-up needed",
        followUpRequired: true,
        followUpNote: "   ",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(
      response.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "followUpNote",
      ),
    ).toBe(true);
  });
    it("allows IT Staff to update an Action Taken", async () => {
    const requester = await createUser({
      displayName: "Update Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Update Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    const action = await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Original description",
        result: "Original result",
        followUpRequired: false,
      },
    });

    const agent = await signIn(staff.email);

    const response = await agent
      .patch(
        `/api/v1/tickets/${ticket.id}/actions-taken/${action.id}`,
      )
      .send({
        expectedUpdatedAt: action.updatedAt.toISOString(),
        description: "Updated description",
        result: "Updated result",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe(
      "Updated description",
    );
    expect(response.body.data.result).toBe("Updated result");
    expect(response.body.data.performedByUserId).toBe(
      staff.id,
    );
  });

  it("does not allow a Requester to update an Action Taken", async () => {
    const requester = await createUser({
      displayName: "Read Only Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Original Performer",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    const action = await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Original description",
        result: "Original result",
        followUpRequired: false,
      },
    });

    const agent = await signIn(requester.email);

    const response = await agent
      .patch(
        `/api/v1/tickets/${ticket.id}/actions-taken/${action.id}`,
      )
      .send({
        expectedUpdatedAt: action.updatedAt.toISOString(),
        description: "Unauthorized edit",
      });

    expect(response.status).toBe(403);
  });

  it("rejects a stale Action Taken update", async () => {
    const requester = await createUser({
      displayName: "Stale Update Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Stale Update Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    const action = await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Original description",
        result: "Original result",
        followUpRequired: false,
      },
    });

    const agent = await signIn(staff.email);

    const staleTimestamp = new Date(
      action.updatedAt.getTime() - 60_000,
    ).toISOString();

    const response = await agent
      .patch(
        `/api/v1/tickets/${ticket.id}/actions-taken/${action.id}`,
      )
      .send({
        expectedUpdatedAt: staleTimestamp,
        description: "Stale edit",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe(
      "STALE_ACTION_TAKEN",
    );
  });

  it("rejects an update without expectedUpdatedAt", async () => {
    const requester = await createUser({
      displayName: "Missing Timestamp Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Missing Timestamp Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    const action = await getPrisma().actionTaken.create({
      data: {
        ticketId: ticket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Original description",
        result: "Original result",
        followUpRequired: false,
      },
    });

    const agent = await signIn(staff.email);

    const response = await agent
      .patch(
        `/api/v1/tickets/${ticket.id}/actions-taken/${action.id}`,
      )
      .send({
        description: "Updated without timestamp",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});