import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const createdClientRequestIds: string[] = [];

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
  });

  it("allows the Ticket owner to upload a permitted PDF attachment", async () => {
    const prisma = getPrisma();

    const requester =
      await prisma.developmentRequester.findFirstOrThrow({
        where: { isActive: true },
      });

    const category = await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

    const relatedSystem =
      await prisma.relatedSystem.findFirstOrThrow({
        where: { isActive: true },
      });

    const clientRequestId = randomUUID();
    createdClientRequestIds.push(clientRequestId);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: `TEST-ATTACH-${randomUUID()}`,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Attachment test Ticket",
        description: "Testing attachment upload for this Ticket.",
        requestedPriority: "Medium",
        status: "New",
        clientRequestId,
      },
    });

    const response = await request(app)
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .set(
        "X-Development-Requester-Id",
        requester.id
      )
      .attach(
        "file",
        Buffer.from("%PDF-1.4 test attachment"),
        {
          filename: "evidence.pdf",
          contentType: "application/pdf",
        }
      );

    expect(response.status).toBe(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        ticketId: ticket.id,
        originalFilename: "evidence.pdf",
        mimeType: "application/pdf",
        isRemoved: false,
      })
    );
  });
  it("rejects an unsupported attachment type", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Invalid attachment test",
      description: "Testing unsupported attachment type.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const response = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach("file", Buffer.from("not allowed"), {
      filename: "malware.txt",
      contentType: "text/plain",
    });

  expect(response.status).toBe(422);
});
it("rejects an Attachment larger than 5 MB", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Oversized attachment test",
      description: "Testing the 5 MB Attachment size limit.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const oversizedFile = Buffer.alloc(
    5 * 1024 * 1024 + 1,
    "a"
  );

  const response = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach("file", oversizedFile, {
      filename: "large.pdf",
      contentType: "application/pdf",
    });

  expect(response.status).toBe(422);
  expect(response.body.error.code).toBe(
    "ATTACHMENT_TOO_LARGE"
  );
});
it("rejects a sixth active Attachment", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Attachment limit test",
      description: "Testing maximum active Attachments.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        originalFilename: `file-${i}.pdf`,
        storageKey: randomUUID(),
        mimeType: "application/pdf",
        sizeBytes: 100,
        uploadedByRequesterId: requester.id,
      },
    });
  }

  const response = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach(
      "file",
      Buffer.from("%PDF-1.4 sixth file"),
      {
        filename: "sixth.pdf",
        contentType: "application/pdf",
      }
    );

  expect(response.status).toBe(422);
  expect(response.body.error.code).toBe(
    "ATTACHMENT_LIMIT_REACHED"
  );
});
it("returns Attachment metadata for the Ticket owner", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Attachment metadata test",
      description: "Testing Attachment metadata retrieval.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const attachment = await prisma.attachment.create({
    data: {
      ticketId: ticket.id,
      originalFilename: "evidence.pdf",
      storageKey: randomUUID(),
      mimeType: "application/pdf",
      sizeBytes: 1234,
      uploadedByRequesterId: requester.id,
    },
  });

  const response = await request(app)
    .get(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id);

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
    ])
  );
});
it("downloads an active Attachment owned by the Requester", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Attachment download test",
      description: "Testing active Attachment download.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const fileContent = Buffer.from("%PDF-1.4 downloadable attachment");

  const uploadResponse = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach("file", fileContent, {
      filename: "download-test.pdf",
      contentType: "application/pdf",
    });

  expect(uploadResponse.status).toBe(201);

  const attachmentId = uploadResponse.body.data.id;

  const response = await request(app)
    .get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`
    )
    .set("X-Development-Requester-Id", requester.id);

  expect(response.status).toBe(200);
  expect(response.headers["content-type"]).toContain(
    "application/pdf"
  );
  expect(response.headers["content-disposition"]).toContain(
    "attachment"
  );
});
it("soft-removes an Attachment and retains its metadata", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Attachment removal test",
      description: "Testing Attachment soft removal.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const uploadResponse = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach(
      "file",
      Buffer.from("%PDF-1.4 removable attachment"),
      {
        filename: "remove-me.pdf",
        contentType: "application/pdf",
      }
    );

  expect(uploadResponse.status).toBe(201);

  const attachmentId = uploadResponse.body.data.id;

  const response = await request(app)
    .delete(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`
    )
    .set("X-Development-Requester-Id", requester.id)
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
    })
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
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Removed Attachment download test",
      description:
        "Testing that removed Attachments cannot be downloaded.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const uploadResponse = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach(
      "file",
      Buffer.from("%PDF-1.4 removed attachment"),
      {
        filename: "removed.pdf",
        contentType: "application/pdf",
      }
    );

  expect(uploadResponse.status).toBe(201);

  const attachmentId = uploadResponse.body.data.id;

  const removeResponse = await request(app)
    .delete(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`
    )
    .set("X-Development-Requester-Id", requester.id)
    .send({
      confirmed: true,
      reason: "No longer required.",
    });

  expect(removeResponse.status).toBe(200);

  const downloadResponse = await request(app)
    .get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`
    )
    .set("X-Development-Requester-Id", requester.id);

  expect(downloadResponse.status).toBe(404);
  expect(downloadResponse.body.error.code).toBe(
    "ATTACHMENT_NOT_FOUND"
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

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: owner.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Attachment ownership test",
      description:
        "Testing cross-Requester Attachment access.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const uploadResponse = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", owner.id)
    .attach(
      "file",
      Buffer.from("%PDF-1.4 private attachment"),
      {
        filename: "private.pdf",
        contentType: "application/pdf",
      }
    );

  expect(uploadResponse.status).toBe(201);

  const attachmentId = uploadResponse.body.data.id;

  const response = await request(app)
    .get(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}/download`
    )
    .set(
      "X-Development-Requester-Id",
      otherRequester.id
    );

  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe(
    "TICKET_NOT_FOUND"
  );
});
it("rejects Attachment removal when the reason is missing", async () => {
  const prisma = getPrisma();

  const requester =
    await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
    });

  const category =
    await prisma.category.findFirstOrThrow({
      where: { isActive: true },
    });

  const relatedSystem =
    await prisma.relatedSystem.findFirstOrThrow({
      where: { isActive: true },
    });

  const clientRequestId = randomUUID();
  createdClientRequestIds.push(clientRequestId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: `TEST-ATTACH-${randomUUID()}`,
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: "Missing removal reason test",
      description:
        "Testing Attachment removal without a reason.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId,
    },
  });

  const uploadResponse = await request(app)
    .post(`/api/v1/tickets/${ticket.id}/attachments`)
    .set("X-Development-Requester-Id", requester.id)
    .attach(
      "file",
      Buffer.from("%PDF-1.4 removal reason test"),
      {
        filename: "reason-test.pdf",
        contentType: "application/pdf",
      }
    );

  expect(uploadResponse.status).toBe(201);

  const attachmentId = uploadResponse.body.data.id;

  const response = await request(app)
    .delete(
      `/api/v1/tickets/${ticket.id}/attachments/${attachmentId}`
    )
    .set("X-Development-Requester-Id", requester.id)
    .send({
      confirmed: true,
      reason: "",
    });

  expect(response.status).toBe(422);
  expect(response.body.error.code).toBe(
    "ATTACHMENT_REMOVAL_REASON_REQUIRED"
  );
});
});