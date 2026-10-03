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

const emailPrefix = "comments-notes-";
const ticketPrefix = "COMMENTS-NOTES-";

async function cleanupFixtures() {
  clearSessionsForTests();
  const prisma = getPrisma();

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
      summary: "VPN account needs comment and note review",
      description: "Comments and notes fixture.",
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

describe.sequential("Lab 3 comments and internal notes API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("allows staff to add public comments and internal notes", async () => {
    const requester = await createUser({
      displayName: "Comment Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Comment Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);
    const staffAgent = await signIn(staff.email);

    const comment = await staffAgent
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .send({ body: "We are investigating the issue." });

    expect(comment.status).toBe(201);
    expect(comment.body.data).toEqual(
      expect.objectContaining({
        body: "We are investigating the issue.",
        visibility: "Public",
      })
    );

    const note = await staffAgent
      .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
      .send({ body: "Check account synchronization logs." });

    expect(note.status).toBe(201);
    expect(note.body.data).toEqual(
      expect.objectContaining({
        body: "Check account synchronization logs.",
        visibility: "Internal",
      })
    );

    const comments = await staffAgent.get(
      `/api/v1/tickets/${ticket.id}/comments`
    );

    expect(comments.status).toBe(200);
    expect(JSON.stringify(comments.body)).toContain(
      "We are investigating the issue."
    );

    const detail = await staffAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );

    expect(detail.status).toBe(200);
    expect(detail.body.data.internalNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: "Check account synchronization logs.",
          visibility: "Internal",
        }),
      ])
    );
  });

  it("allows requesters to add public comments but blocks internal notes", async () => {
    const requester = await createUser({
      displayName: "Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });

    const staff = await createUser({
      displayName: "Staff",
      roles: ["ITStaff"],
    });

    const ticket = await createTicket(requester.id);

    const requesterAgent = await signIn(requester.email);
    const staffAgent = await signIn(staff.email);

    const comment = await requesterAgent
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .send({ body: "I can provide more information." });

    expect(comment.status).toBe(201);

    const note = await staffAgent
      .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
      .send({ body: "Internal troubleshooting note." });

    expect(note.status).toBe(201);

    const visibleComments = await requesterAgent.get(
      `/api/v1/tickets/${ticket.id}/comments`
    );

    expect(visibleComments.status).toBe(200);
    expect(JSON.stringify(visibleComments.body)).toContain(
      "I can provide more information."
    );
    expect(JSON.stringify(visibleComments.body)).not.toContain(
      "Internal troubleshooting note."
    );

    const forbidden = await requesterAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );

    expect(forbidden.status).toBe(403);

    const invalidComment = await requesterAgent
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .send({ body: "" });

    expect(invalidComment.status).toBe(422);
    expect(invalidComment.body.error.code).toBe("VALIDATION_ERROR");
  });
});