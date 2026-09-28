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

const emailPrefix = "staff-actions-";
const ticketPrefix = "STAFF-ACTIONS-";

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
  isActive?: boolean;
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
      isActive: options.isActive ?? true,
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
      description: "Ticket fixture used for the full staff workflow.",
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

describe.sequential("Lab 3 staff ticket management API", () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);

  it("claims, reassigns, prioritizes, transitions, and records staff history", async () => {
    const requester = await createUser({
      displayName: "Workflow Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const staff = await createUser({
      displayName: "Workflow Staff",
      roles: ["ITStaff"],
    });
    const secondStaff = await createUser({
      displayName: "Workflow Assignee",
      roles: ["ITStaff"],
    });
    const inactiveStaff = await createUser({
      displayName: "Inactive Assignee",
      roles: ["ITStaff"],
      isActive: false,
    });
    const nonStaff = await createUser({
      displayName: "Requester Cannot Be Assigned",
      roles: ["Requester"],
    });
    const ticket = await createTicket(requester.id);
    const staffAgent = await signIn(staff.email);

    const claim = await staffAgent.post(
      `/api/v1/staff/tickets/${ticket.id}/claim`
    );
    expect(claim.status).toBe(200);
    expect(claim.body.data.assignedTo.id).toBe(staff.id);

    const conflict = await staffAgent.post(
      `/api/v1/staff/tickets/${ticket.id}/claim`
    );
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("TICKET_ALREADY_ASSIGNED");

    const invalidInactive = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/assignment`)
      .send({ assignedToUserId: inactiveStaff.id });
    const invalidRole = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/assignment`)
      .send({ assignedToUserId: nonStaff.id });

    for (const response of [invalidInactive, invalidRole]) {
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.fieldErrors[0].field).toBe(
        "assignedToUserId"
      );
    }

    const assignment = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/assignment`)
      .send({ assignedToUserId: secondStaff.id });
    expect(assignment.status).toBe(200);
    expect(assignment.body.data.assignedTo.id).toBe(secondStaff.id);

    const priority = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/it-priority`)
      .send({ itPriority: "Urgent" });
    expect(priority.status).toBe(200);
    expect(priority.body.data.itPriority).toBe("Urgent");

    const status = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({
        status: "InProgress",
        reason: "Started VPN investigation.",
      });
    expect(status.status).toBe(200);
    expect(status.body.data.status).toBe("InProgress");

    const invalidStatus = await staffAgent
      .patch(`/api/v1/staff/tickets/${ticket.id}/status`)
      .send({ status: "Closed" });
    expect(invalidStatus.status).toBe(422);
    expect(invalidStatus.body.error.code).toBe("VALIDATION_ERROR");

    const [comment, note, action] = await Promise.all([
      staffAgent
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .send({ body: "We are investigating the VPN issue." }),
      staffAgent
        .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
        .send({ body: "Account synchronization appears delayed." }),
      staffAgent
        .post(`/api/v1/staff/tickets/${ticket.id}/actions`)
        .send({ body: "Reviewed connection logs." }),
    ]);

    expect(comment.status).toBe(201);
    expect(note.status).toBe(201);
    expect(action.status).toBe(201);

    const detail = await staffAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );
    expect(detail.status).toBe(200);
    expect(detail.body.data).toEqual(
      expect.objectContaining({
        requestedPriority: "High",
        itPriority: "Urgent",
        status: "InProgress",
        assignedTo: expect.objectContaining({ id: secondStaff.id }),
      })
    );
    expect(detail.body.data.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: "We are investigating the VPN issue.",
          visibility: "Public",
        }),
      ])
    );
    expect(detail.body.data.internalNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: "Account synchronization appears delayed.",
          visibility: "Internal",
        }),
      ])
    );
    expect(detail.body.data.actions.map((item: { actionType: string }) => item.actionType)).toEqual(
      expect.arrayContaining([
        "TicketClaimed",
        "AssignmentChanged",
        "ITPriorityChanged",
        "StatusChanged",
        "ActionTaken",
      ])
    );
  });

  it("allows a Requester to see and add public comments but never internal notes", async () => {
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
    const requesterAgent = await signIn(requester.email);
    const staffAgent = await signIn(staff.email);

    const requesterComment = await requesterAgent
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .send({ body: "I can provide a screenshot." });
    const staffNote = await staffAgent
      .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
      .send({ body: "Use the account-sync troubleshooting runbook." });

    expect(requesterComment.status).toBe(201);
    expect(staffNote.status).toBe(201);

    const comments = await requesterAgent.get(
      `/api/v1/tickets/${ticket.id}/comments`
    );
    expect(comments.status).toBe(200);
    expect(JSON.stringify(comments.body)).toContain(
      "I can provide a screenshot."
    );
    expect(JSON.stringify(comments.body)).not.toContain(
      "account-sync troubleshooting"
    );

    const directInternalAccess = await requesterAgent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );
    expect(directInternalAccess.status).toBe(403);

    const invalidComment = await requesterAgent
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .send({ body: "" });
    expect(invalidComment.status).toBe(422);
    expect(invalidComment.body.error.code).toBe("VALIDATION_ERROR");
  });
});
