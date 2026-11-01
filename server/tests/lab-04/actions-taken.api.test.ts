
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

function validActionPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    actionAt: "2026-10-29T05:00:00.000Z",
    description: "Checked network settings",
    result: "Network configuration reviewed",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    ...overrides,
  };
}

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
      .set("Idempotency-Key", randomUUID())
      .send(
        validActionPayload({
          followUpRequired: true,
          followUpNote: "Verify after restart",
          performedByUserId: requester.id,
        }),
      );

    expect(response.status).toBe(201);

    const savedAction =
      await getPrisma().actionTaken.findFirstOrThrow({
        where: {
          ticketId: ticket.id,
          description: "Checked network settings",
        },
      });

    expect(savedAction.performedByUserId).toBe(staff.id);
    expect(savedAction.performedByUserId).not.toBe(requester.id);
    expect(savedAction.followUpRequired).toBe(true);
    expect(savedAction.followUpNote).toBe("Verify after restart");
  });

  it("allows an Administrator to create an Action Taken", async () => {
    const requester = await createUser({
      displayName: "Admin Action Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const administrator = await createUser({
      displayName: "Actions Administrator",
      roles: ["Administrator"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(administrator.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", randomUUID())
      .send(validActionPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.performedByUserId).toBe(
      administrator.id,
    );
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
      .send(validActionPayload());

    expect(response.status).toBe(403);
  });

  it("requires an Idempotency-Key for Action Taken creation", async () => {
    const requester = await createUser({
      displayName: "Missing Key Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Missing Key Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .send(validActionPayload());

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(
      response.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "idempotencyKey",
      ),
    ).toBe(true);
  });

  it("replays the same Action Taken when the same key and payload are submitted again", async () => {
    const requester = await createUser({
      displayName: "Replay Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Replay Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);
    const idempotencyKey = randomUUID();
    const payload = validActionPayload();

    const firstResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    const replayResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(replayResponse.status).toBe(200);
    expect(replayResponse.headers["idempotency-replayed"]).toBe(
      "true",
    );

    expect(replayResponse.body.data.id).toBe(
      firstResponse.body.data.id,
    );

    const count = await getPrisma().actionTaken.count({
      where: {
        ticketId: ticket.id,
      },
    });

    expect(count).toBe(1);
  });

  it("rejects reusing an Idempotency-Key with a different payload", async () => {
    const requester = await createUser({
      displayName: "Key Reuse Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Key Reuse Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);
    const idempotencyKey = randomUUID();

    const firstResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", idempotencyKey)
      .send(validActionPayload());

    const secondResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", idempotencyKey)
      .send(
        validActionPayload({
          description: "Different description",
        }),
      );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe(
      "IDEMPOTENCY_KEY_REUSED",
    );

    const count = await getPrisma().actionTaken.count({
      where: {
        ticketId: ticket.id,
      },
    });

    expect(count).toBe(1);
  });

  it("returns 404 when creating an Action Taken for a missing Ticket", async () => {
    const staff = await createUser({
      displayName: "Missing Ticket Staff",
      roles: ["ITStaff"],
    });

    const agent = await signIn(staff.email);

    const response = await agent
      .post(`/api/v1/tickets/${randomUUID()}/actions-taken`)
      .set("Idempotency-Key", randomUUID())
      .send(validActionPayload());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TICKET_NOT_FOUND");
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
      .set("Idempotency-Key", randomUUID())
      .send(
        validActionPayload({
          result: "Follow-up needed",
          followUpRequired: true,
          followUpNote: "   ",
        }),
      );

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(
      response.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "followUpNote",
      ),
    ).toBe(true);
  });

  it("rejects invalid Action Taken fields", async () => {
    const requester = await createUser({
      displayName: "Invalid Data Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Invalid Data Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const agent = await signIn(staff.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/actions-taken`)
      .set("Idempotency-Key", randomUUID())
      .send(
        validActionPayload({
          actionAt: "not-a-date",
          description: "",
          result: "",
        }),
      );

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    const fields = response.body.error.fieldErrors.map(
      (error: { field: string }) => error.field,
    );

    expect(fields).toContain("actionAt");
    expect(fields).toContain("description");
    expect(fields).toContain("result");
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

  it("allows an Administrator to update an Action Taken", async () => {
    const requester = await createUser({
      displayName: "Admin Update Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Admin Update Original Staff",
      roles: ["ITStaff"],
    });

    const administrator = await createUser({
      displayName: "Admin Update User",
      roles: ["Administrator"],
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

    const agent = await signIn(administrator.email);

    const response = await agent
      .patch(
        `/api/v1/tickets/${ticket.id}/actions-taken/${action.id}`,
      )
      .send({
        expectedUpdatedAt: action.updatedAt.toISOString(),
        description: "Administrator updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe(
      "Administrator updated description",
    );

    // Updating the record must not replace its original performer.
    expect(response.body.data.performedByUserId).toBe(staff.id);
    expect(response.body.data.performedByUserId).not.toBe(
      administrator.id,
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

  it("returns 404 when updating an Action Taken through the wrong Ticket", async () => {
    const requester = await createUser({
      displayName: "Wrong Ticket Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Wrong Ticket Staff",
      roles: ["ITStaff"],
    });

    const firstTicket = await createTicket(requester.id);
    const secondTicket = await createTicket(requester.id);

    const action = await getPrisma().actionTaken.create({
      data: {
        ticketId: firstTicket.id,
        performedByUserId: staff.id,
        actionAt: new Date("2026-10-29T05:00:00.000Z"),
        description: "Action on first Ticket",
        result: "Original result",
        followUpRequired: false,
      },
    });

    const agent = await signIn(staff.email);

    const response = await agent
      .patch(
        `/api/v1/tickets/${secondTicket.id}/actions-taken/${action.id}`,
      )
      .send({
        expectedUpdatedAt: action.updatedAt.toISOString(),
        description: "Wrong Ticket update",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe(
      "ACTION_TAKEN_NOT_FOUND",
    );
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
