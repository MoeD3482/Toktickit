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

describe("GET /api/v1/tickets/:id", () => {
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

  it("returns the authenticated Requester's Ticket detail", async () => {
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
        ticketNo: `TEST-DETAIL-${randomUUID()}`,
        requesterId: requester.id,
        requesterUserId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "VPN connection problem",
        description:
          "Unable to connect to the campus VPN.",
        requestedPriority: "High",
        status: "New",
        clientRequestId,
      },
    });

    const agent = await loginAsRequester(
      requester.email
    );

    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}`
    );

    expect(response.status).toBe(200);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        summary: "VPN connection problem",
        description:
          "Unable to connect to the campus VPN.",
        requestedPriority: "High",
        status: "New",
      })
    );

    expect(response.body.data.category).toEqual(
      expect.objectContaining({
        id: category.id,
        name: category.name,
      })
    );

    expect(response.body.data.relatedSystem).toEqual(
      expect.objectContaining({
        id: relatedSystem.id,
        name: relatedSystem.name,
      })
    );
  });

  it("does not allow another Requester to view the Ticket", async () => {
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
        ticketNo: `TEST-DETAIL-${randomUUID()}`,
        requesterId: owner.id,
        requesterUserId: owner.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Private requester Ticket",
        description:
          "Only the Ticket owner may view this Ticket.",
        requestedPriority: "Medium",
        status: "New",
        clientRequestId,
      },
    });

    const agent = await loginAsRequester(
      otherRequester.email
    );

    const response = await agent.get(
      `/api/v1/tickets/${ticket.id}`
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe(
      "TICKET_NOT_FOUND"
    );
  });
});