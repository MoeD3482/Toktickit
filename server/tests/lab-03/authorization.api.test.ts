import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth/password.js";
import { clearSessionsForTests } from "../../src/auth/session.js";
import type { UserRole } from "@prisma/client";

const createdUserEmails: string[] = [];
const createdDevelopmentRequesterIds: string[] = [];
const createdTicketIds: string[] = [];
const testEmailPrefix = "authorization-";
const testTicketPrefix = "AUTHZ-";

async function cleanupAuthorizationFixtures() {
  clearSessionsForTests();

  const prisma = getPrisma();

  await prisma.attachment.deleteMany({
    where: {
      ticket: {
        ticketNo: {
          startsWith: testTicketPrefix,
        },
      },
    },
  });

  await prisma.ticket.deleteMany({
    where: {
      ticketNo: {
        startsWith: testTicketPrefix,
      },
    },
  });

  await prisma.developmentRequester.deleteMany({
    where: {
      email: {
        startsWith: testEmailPrefix,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: testEmailPrefix,
      },
    },
  });

  createdTicketIds.length = 0;
  createdDevelopmentRequesterIds.length = 0;
  createdUserEmails.length = 0;
}

async function createUser(options: {
  displayName: string;
  roles: UserRole[];
  requesterProfile?: boolean;
}) {
  const prisma = getPrisma();
  const email = `${testEmailPrefix}${randomUUID()}@example.com`;
  createdUserEmails.push(email);

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
    createdDevelopmentRequesterIds.push(user.id);
  }

  return user;
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

async function createTicketForRequester(requesterUserId: string) {
  const prisma = getPrisma();

  const category = await prisma.category.findFirstOrThrow({
    where: {
      isActive: true,
    },
  });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: {
        isActive: true,
      },
    });

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `${testTicketPrefix}${randomUUID()}`,
      requesterId: requesterUserId,
      requesterUserId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Private authorization Ticket",
      description:
        "Ticket fixture used to verify authorization boundaries.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId: randomUUID(),
    },
  });

  createdTicketIds.push(ticket.id);

  return ticket;
}

describe.sequential("Lab 3 authorization API", () => {
  beforeEach(cleanupAuthorizationFixtures);
  afterEach(cleanupAuthorizationFixtures);

  it("requires authentication before Lab 3 requester, staff, and admin APIs", async () => {
    const requesterResponse = await request(app).get(
      "/api/v1/tickets"
    );
    const staffResponse = await request(app).get(
      "/api/v1/staff/tickets"
    );
    const adminResponse = await request(app).get(
      "/api/v1/admin/users"
    );

    expect(requesterResponse.status).toBe(401);
    expect(requesterResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
    expect(staffResponse.status).toBe(401);
    expect(staffResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
    expect(adminResponse.status).toBe(401);
    expect(adminResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
  });

  it("rejects wrong-role access with safe forbidden responses", async () => {
    const requester = await createUser({
      displayName: "Requester Role Test",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const staff = await createUser({
      displayName: "Staff Role Test",
      roles: ["ITStaff"],
    });
    const admin = await createUser({
      displayName: "Admin Role Test",
      roles: ["Administrator"],
    });

    const requesterAgent = await signIn(requester.email);
    const staffAgent = await signIn(staff.email);
    const adminAgent = await signIn(admin.email);

    const requesterToStaff = await requesterAgent.get(
      "/api/v1/staff/tickets"
    );
    const staffToAdmin = await staffAgent.get(
      "/api/v1/admin/users"
    );
    const staffToRequester = await staffAgent.get(
      "/api/v1/tickets"
    );
    const adminToStaff = await adminAgent.get(
      "/api/v1/staff/tickets"
    );

    for (const response of [
      requesterToStaff,
      staffToAdmin,
      staffToRequester,
      adminToStaff,
    ]) {
      expect(response.status).toBe(403);
      expect(response.body.error).toEqual({
        code: "FORBIDDEN",
        message: "You are not allowed to use this feature.",
        fieldErrors: [],
      });
    }
  });

  it("does not reveal another Requester's Ticket through detail or search", async () => {
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
    const ticket = await createTicketForRequester(owner.id);
    const otherAgent = await signIn(otherRequester.email);

    const detailResponse = await otherAgent.get(
      `/api/v1/tickets/${ticket.id}`
    );
    const listResponse = await otherAgent.get(
      `/api/v1/tickets?search=${encodeURIComponent(ticket.ticketNo)}`
    );

    expect(detailResponse.status).toBe(404);
    expect(detailResponse.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(JSON.stringify(detailResponse.body)).not.toContain(
      ticket.summary
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
    expect(listResponse.body.meta.totalItems).toBe(0);
  });

  it("does not let authenticated Requesters bypass ownership with development headers", async () => {
    const owner = await createUser({
      displayName: "Header Bypass Owner",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const otherRequester = await createUser({
      displayName: "Header Bypass Other Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const ticket = await createTicketForRequester(owner.id);
    const otherAgent = await signIn(otherRequester.email);

    const response = await otherAgent
      .get(`/api/v1/tickets/${ticket.id}`)
      .set("X-Development-Requester-Id", owner.id);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(JSON.stringify(response.body)).not.toContain(
      ticket.summary
    );
  });

  it("does not reveal another Requester's Attachment through direct API access", async () => {
    const owner = await createUser({
      displayName: "Attachment Owner",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const otherRequester = await createUser({
      displayName: "Attachment Other Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const ticket = await createTicketForRequester(owner.id);

    const attachment = await getPrisma().attachment.create({
      data: {
        ticketId: ticket.id,
        originalFilename: "private-evidence.pdf",
        storageKey: randomUUID(),
        mimeType: "application/pdf",
        sizeBytes: 123,
        uploadedByRequesterId: owner.id,
        uploadedByUserId: owner.id,
      },
    });

    const otherAgent = await signIn(otherRequester.email);

    const downloadResponse = await otherAgent.get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachment.id}/download`
    );
    const deleteResponse = await otherAgent
      .delete(
        `/api/v1/tickets/${ticket.id}/attachments/${attachment.id}`
      )
      .send({
        confirmed: true,
        reason: "Attempted direct access.",
      });

    for (const response of [downloadResponse, deleteResponse]) {
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("TICKET_NOT_FOUND");
      expect(JSON.stringify(response.body)).not.toContain(
        attachment.originalFilename
      );
      expect(JSON.stringify(response.body)).not.toContain(
        attachment.storageKey
      );
    }
  });

  it("prevents Requesters from using Internal Note APIs", async () => {
    const requester = await createUser({
      displayName: "Internal Note Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const ticket = await createTicketForRequester(requester.id);
    const agent = await signIn(requester.email);

    const response = await agent
      .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
      .send({
        body: "Requester should never create internal notes.",
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(JSON.stringify(response.body)).not.toContain(ticket.id);
  });

  it("allows IT Staff to use staff APIs but not Administrator user management", async () => {
    const requester = await createUser({
      displayName: "Staff Visible Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const staff = await createUser({
      displayName: "Authorized Staff",
      roles: ["ITStaff"],
    });
    const ticket = await createTicketForRequester(requester.id);
    const agent = await signIn(staff.email);

    const listResponse = await agent.get("/api/v1/staff/tickets");
    const detailResponse = await agent.get(
      `/api/v1/staff/tickets/${ticket.id}`
    );
    const noteResponse = await agent
      .post(`/api/v1/staff/tickets/${ticket.id}/internal-notes`)
      .send({
        body: "Visible only to staff.",
      });
    const adminResponse = await agent.get("/api/v1/admin/users");

    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.data.some(
        (item: { id: string }) => item.id === ticket.id
      )
    ).toBe(true);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(ticket.id);
    expect(noteResponse.status).toBe(201);
    expect(noteResponse.body.data.visibility).toBe("Internal");
    expect(adminResponse.status).toBe(403);
  });

  it("allows Administrators to view safe user records only", async () => {
    const admin = await createUser({
      displayName: "Authorized Admin",
      roles: ["Administrator"],
    });
    const requester = await createUser({
      displayName: "Admin Visible Requester",
      roles: ["Requester"],
      requesterProfile: true,
    });
    const agent = await signIn(admin.email);

    const listResponse = await agent.get("/api/v1/admin/users");
    const detailResponse = await agent.get(
      `/api/v1/admin/users/${requester.id}`
    );
    const createResponse = await agent
      .post("/api/v1/admin/users")
      .send({
        email: "later@example.com",
      });

    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.data.some(
        (item: { id: string }) => item.id === requester.id
      )
    ).toBe(true);
    expect(JSON.stringify(listResponse.body)).not.toContain(
      "passwordHash"
    );

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(requester.id);
    expect(detailResponse.body.data.passwordHash).toBeUndefined();
    expect(createResponse.status).toBe(501);
    expect(createResponse.body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
