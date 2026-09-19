import { afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { clearSessionsForTests } from "../../src/auth/session.js";

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

describe("POST /api/v1/tickets", () => {
  afterEach(() => {
    clearSessionsForTests();
  });

  it("creates a valid Ticket for the authenticated Requester", async () => {
    const prisma = getPrisma();

    const requester = await prisma.developmentRequester.findFirst({
      where: { isActive: true },
    });

    const category = await prisma.category.findFirst({
      where: { isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });

    expect(requester).not.toBeNull();
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    const agent = await loginAsRequester(requester!.email);
    const clientRequestId = randomUUID();

    const res = await agent
      .post("/api/v1/tickets")
      .send({
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Unable to connect to campus VPN",
        description:
          "The VPN client fails to connect from my laptop while using campus Wi-Fi.",
        requestedPriority: "High",
        clientRequestId,
      });

    expect(res.status).toBe(201);

    expect(res.body.data.ticketNo).toMatch(
      /^TKT-\d{4}-\d{5}$/
    );

    expect(res.body.data.status).toBe("New");
    expect(res.body.data.requester.id).toBe(requester!.id);
    expect(res.body.data.summary).toBe(
      "Unable to connect to campus VPN"
    );

    const savedTicket = await prisma.ticket.findUnique({
      where: {
        clientRequestId,
      },
    });

    expect(savedTicket?.requesterUserId).toBe(
      requester!.id
    );

    await prisma.ticket.deleteMany({
      where: { clientRequestId },
    });
  });

  it("rejects invalid Ticket data", async () => {
    const requester = await getPrisma().developmentRequester.findFirst({
      where: { isActive: true },
    });

    expect(requester).not.toBeNull();

    const agent = await loginAsRequester(requester!.email);

    const res = await agent
      .post("/api/v1/tickets")
      .send({
        summary: "a",
        description: "short",
        requestedPriority: "Critical",
        clientRequestId: randomUUID(),
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");

    expect(
      res.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "summary"
      )
    ).toBe(true);

    expect(
      res.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "description"
      )
    ).toBe(true);

    expect(
      res.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "requestedPriority"
      )
    ).toBe(true);
  });

  it("does not create a duplicate Ticket for the same clientRequestId", async () => {
    const prisma = getPrisma();

    const requester = await prisma.developmentRequester.findFirst({
      where: { isActive: true },
    });

    const category = await prisma.category.findFirst({
      where: { isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });

    expect(requester).not.toBeNull();
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    const agent = await loginAsRequester(requester!.email);
    const clientRequestId = randomUUID();

    const payload = {
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: "Laptop cannot access VPN",
      description:
        "The laptop cannot connect to the VPN from the campus network.",
      requestedPriority: "Medium",
      clientRequestId,
    };

    const firstResponse = await agent
      .post("/api/v1/tickets")
      .send(payload);

    const secondResponse = await agent
      .post("/api/v1/tickets")
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);

    expect(secondResponse.body.data.id).toBe(
      firstResponse.body.data.id
    );

    expect(secondResponse.body.data.ticketNo).toBe(
      firstResponse.body.data.ticketNo
    );

    const ticketCount = await prisma.ticket.count({
      where: { clientRequestId },
    });

    expect(ticketCount).toBe(1);

    await prisma.ticket.deleteMany({
      where: { clientRequestId },
    });
  });

  it("does not expose a Ticket when another Requester reuses the same clientRequestId", async () => {
    const prisma = getPrisma();

    const requesters =
      await prisma.developmentRequester.findMany({
        where: { isActive: true },
        take: 2,
      });

    const category = await prisma.category.findFirst({
      where: { isActive: true },
    });

    const relatedSystem =
      await prisma.relatedSystem.findFirst({
        where: { isActive: true },
      });

    expect(requesters).toHaveLength(2);
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    const firstAgent = await loginAsRequester(
      requesters[0].email
    );

    const secondAgent = await loginAsRequester(
      requesters[1].email
    );

    const clientRequestId = randomUUID();

    const payload = {
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: "Unable to connect to campus VPN",
      description:
        "The VPN client fails to connect from my laptop while using campus Wi-Fi.",
      requestedPriority: "High",
      clientRequestId,
    };

    const firstResponse = await firstAgent
      .post("/api/v1/tickets")
      .send(payload);

    const secondResponse = await secondAgent
      .post("/api/v1/tickets")
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe(
      "CLIENT_REQUEST_ID_CONFLICT"
    );

    await prisma.ticket.deleteMany({
      where: { clientRequestId },
    });
  });
});