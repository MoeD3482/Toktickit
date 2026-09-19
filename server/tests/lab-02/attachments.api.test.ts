import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { clearSessionsForTests } from "../../src/auth/session.js";

const createdClientRequestIds: string[] = [];
const TEST_PASSWORD = "ChangeMe123!";

async function loginAsRequester(email: string) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/v1/auth/login")
    .send({
      email,
      password: TEST_PASSWORD,
    });

  expect(response.status).toBe(200);

  return agent;
}

async function createTestTicket(
  requesterId: string,
  summary: string,
  description: string,
) {
  const prisma = getPrisma();

  const category = await prisma.category.findFirstOrThrow({
    where: { isActive: true },
  });

  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({
    where: { isActive: true },
  });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  return prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId,
      requesterUserId: requesterId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary,
      description,
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });
}

describe("POST /api/v1/tickets/:id/attachments", () => {
  afterEach(async () => {
    const prisma = getPrisma();

    if (createdClientRequestIds.length > 0) {
      await prisma.ticket.deleteMany({
        where: {
          clientRequestId: {
            in: createdClientRequestIds,
          },
        },
      });

      createdClientRequestIds.length = 0;
    }

    clearSessionsForTests();
  });

  it("allows the Ticket owner to upload a permitted PDF attachment", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Attachment test Ticket",
      "Testing attachment upload for this Ticket.",
    );

    const agent = await loginAsRequester(requester.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach("file", Buffer.from("%PDF-1.4 test attachment"), {
        filename: "evidence.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        ticketId: ticket.id,
        originalFilename: "evidence.pdf",
        mimeType: "application/pdf",
        isRemoved: false,
      }),
    );
  });

  it("rejects an unsupported attachment type", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Invalid attachment test",
      "Testing unsupported attachment type.",
    );

    const agent = await loginAsRequester(requester.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach("file", Buffer.from("not allowed"), {
        filename: "malware.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(422);
  });

  it("rejects an Attachment larger than 5 MB", async () => {
    const requester =
      await getPrisma().developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Oversized attachment test",
      "Testing the 5 MB Attachment size limit.",
    );

    const oversizedFile = Buffer.alloc(
      5 * 1024 * 1024 + 1,
      "a",
    );

    const agent = await loginAsRequester(requester.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach("file", oversizedFile, {
        filename: "large.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe(
      "ATTACHMENT_TOO_LARGE",
    );
  });

  it("rejects a sixth active Attachment", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Attachment limit test",
      "Testing maximum active Attachments.",
    );

    for (let i = 1; i <= 5; i++) {
      await prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          originalFilename: `file-${i}.pdf`,
          storageKey: randomUUID(),
          mimeType: "application/pdf",
          sizeBytes: 100,
          uploadedByRequesterId: requester.id,
          uploadedByUserId: requester.id,
        },
      });
    }

    const agent = await loginAsRequester(requester.email);

    const response = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach("file", Buffer.from("%PDF-1.4 sixth file"), {
        filename: "sixth.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe(
      "ATTACHMENT_LIMIT_REACHED",
    );
  });

  it("returns Attachment metadata for the Ticket owner", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Attachment metadata test",
      "Testing Attachment metadata retrieval.",
    );

    const attachment = await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        originalFilename: "evidence.pdf",
        storageKey: randomUUID(),
        mimeType: "application/pdf",
        sizeBytes: 1234,
        uploadedByRequesterId: requester.id,
        uploadedByUserId: requester.id,
      },
    });

    const agent = await loginAsRequester(requester.email);

    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}/attachments`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: attachment.id,
          ticketId: ticket.id,
          originalFilename: "evidence.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1234,
          isRemoved: false,
        }),
      ]),
    );
  });

  it("downloads an active Attachment owned by the Requester", async () => {
    const requester =
      await getPrisma().developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Attachment download test",
      "Testing active Attachment download.",
    );

    const agent = await loginAsRequester(requester.email);

    const uploadResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach(
        "file",
        Buffer.from("%PDF-1.4 downloadable attachment"),
        {
          filename: "download-test.pdf",
          contentType: "application/pdf",
        },
      );

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data.id;

    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`,
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain(
      "application/pdf",
    );
    expect(response.headers["content-disposition"]).toContain(
      "attachment",
    );
  });

  it("soft-removes an Attachment and retains its metadata", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Attachment removal test",
      "Testing Attachment soft removal.",
    );

    const agent = await loginAsRequester(requester.email);

    const uploadResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach(
        "file",
        Buffer.from("%PDF-1.4 removable attachment"),
        {
          filename: "remove-me.pdf",
          contentType: "application/pdf",
        },
      );

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data.id;

    const response = await agent
      .delete(
        `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`,
      )
      .send({
        confirmed: true,
        reason: "Attachment is no longer needed.",
      });

    expect(response.status).toBe(200);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: attachmentId,
        isRemoved: true,
        removalReason: "Attachment is no longer needed.",
      }),
    );

    const savedAttachment =
      await prisma.attachment.findUnique({
        where: {
          id: attachmentId,
        },
      });

    expect(savedAttachment).not.toBeNull();
    expect(savedAttachment?.isRemoved).toBe(true);
    expect(savedAttachment?.removedAt).not.toBeNull();
  });

  it("does not allow downloading a soft-removed Attachment", async () => {
    const requester =
      await getPrisma().developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Removed Attachment download test",
      "Testing that removed Attachments cannot be downloaded.",
    );

    const agent = await loginAsRequester(requester.email);

    const uploadResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach(
        "file",
        Buffer.from("%PDF-1.4 removed attachment"),
        {
          filename: "removed.pdf",
          contentType: "application/pdf",
        },
      );

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data.id;

    const removeResponse = await agent
      .delete(
        `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`,
      )
      .send({
        confirmed: true,
        reason: "No longer required.",
      });

    expect(removeResponse.status).toBe(200);

    const downloadResponse = await agent.get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`,
    );

    expect(downloadResponse.status).toBe(404);
    expect(downloadResponse.body.error.code).toBe(
      "ATTACHMENT_NOT_FOUND",
    );
  });

  it("rejects cross-Requester access to another Requester's Attachment", async () => {
    const prisma = getPrisma();

    const requesters =
      await prisma.developmentRequester.findMany({
        where: { isActive: true },
        take: 2,
      });

    expect(requesters.length).toBeGreaterThanOrEqual(2);

    const owner = requesters[0];
    const otherRequester = requesters[1];

    const ticket = await createTestTicket(
      owner.id,
      "Attachment ownership test",
      "Testing cross-Requester Attachment access.",
    );

    const ownerAgent = await loginAsRequester(owner.email);

    const uploadResponse = await ownerAgent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach(
        "file",
        Buffer.from("%PDF-1.4 private attachment"),
        {
          filename: "private.pdf",
          contentType: "application/pdf",
        },
      );

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data.id;

    const otherAgent = await loginAsRequester(
      otherRequester.email,
    );

    const response = await otherAgent.get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe(
      "TICKET_NOT_FOUND",
    );
  });

  it("rejects Attachment removal when the reason is missing", async () => {
    const requester =
      await getPrisma().developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const ticket = await createTestTicket(
      requester.id,
      "Missing removal reason test",
      "Testing Attachment removal without a reason.",
    );

    const agent = await loginAsRequester(requester.email);

    const uploadResponse = await agent
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .attach(
        "file",
        Buffer.from("%PDF-1.4 removal reason test"),
        {
          filename: "reason-test.pdf",
          contentType: "application/pdf",
        },
      );

    expect(uploadResponse.status).toBe(201);

    const attachmentId = uploadResponse.body.data.id;

    const response = await agent
      .delete(
        `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`,
      )
      .send({
        confirmed: true,
        reason: "",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe(
      "ATTACHMENT_REMOVAL_REASON_REQUIRED",
    );
  });
});