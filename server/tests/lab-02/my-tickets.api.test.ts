import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const createdClientRequestIds: string[] = [];

describe("GET /api/v1/tickets", () => {
  afterEach(async () => {
    const prisma = getPrisma();

    await prisma.ticket.deleteMany({
      where: {
        clientRequestId: {
          in: createdClientRequestIds,
        },
      },
    });

    createdClientRequestIds.length = 0;
  });

  it("returns only Tickets owned by the selected Requester", async () => {
    const prisma = getPrisma();

    const requesters = await prisma.developmentRequester.findMany({
      where: { isActive: true },
      take: 2,
      orderBy: { displayName: "asc" },
    });

    const category = await prisma.category.findFirst({
      where: { isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });

    expect(requesters).toHaveLength(2);
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    const requesterA = requesters[0];
    const requesterB = requesters[1];

    const requestIdA = randomUUID();
    const requestIdB = randomUUID();

    createdClientRequestIds.push(requestIdA, requestIdB);

    await prisma.ticket.create({
      data: {
        ticketNo: `TEST-A-${randomUUID()}`,
        requesterId: requesterA.id,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Requester A VPN issue",
        description: "Requester A cannot connect to the campus VPN.",
        requestedPriority: "High",
        status: "New",
        clientRequestId: requestIdA,
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNo: `TEST-B-${randomUUID()}`,
        requesterId: requesterB.id,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Requester B printer issue",
        description: "Requester B cannot print from the office printer.",
        requestedPriority: "Medium",
        status: "New",
        clientRequestId: requestIdB,
      },
    });

    const res = await request(app)
      .get("/api/v1/tickets")
      .set("X-Development-Requester-Id", requesterA.id);

    expect(res.status).toBe(200);

    expect(
  res.body.data.some(
    (ticket: { summary: string }) =>
      ticket.summary === "Requester A VPN issue"
  )
).toBe(true);

    expect(
      res.body.data.some(
        (ticket: { summary: string }) =>
          ticket.summary === "Requester B printer issue"
      )
    ).toBe(false);
  });
  it("searches the selected Requester's Tickets", async () => {
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

  const requestId1 = randomUUID();
  const requestId2 = randomUUID();

  createdClientRequestIds.push(requestId1, requestId2);

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-SEARCH-1-${randomUUID()}`,
      requesterId: requester!.id,
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: "Campus VPN connection problem",
      description: "The requester cannot connect to the campus VPN.",
      requestedPriority: "High",
      status: "New",
      clientRequestId: requestId1,
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-SEARCH-2-${randomUUID()}`,
      requesterId: requester!.id,
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: "Office printer problem",
      description: "The office printer is not responding.",
      requestedPriority: "Medium",
      status: "New",
      clientRequestId: requestId2,
    },
  });

  const res = await request(app)
    .get("/api/v1/tickets?search=vpn")
    .set("X-Development-Requester-Id", requester!.id);

  expect(res.status).toBe(200);

  expect(
    res.body.data.some(
      (ticket: { summary: string }) =>
        ticket.summary === "Campus VPN connection problem"
    )
  ).toBe(true);

  expect(
    res.body.data.some(
      (ticket: { summary: string }) =>
        ticket.summary === "Office printer problem"
    )
  ).toBe(false);
});
it("filters the selected Requester's Tickets", async () => {
  const prisma = getPrisma();

  const requester = await prisma.developmentRequester.findFirst({
    where: { isActive: true },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    take: 2,
    orderBy: { id: "asc" },
  });

  const relatedSystems = await prisma.relatedSystem.findMany({
    where: { isActive: true },
    take: 2,
    orderBy: { name: "asc" },
  });

  expect(requester).not.toBeNull();
  expect(categories).toHaveLength(2);
  expect(relatedSystems).toHaveLength(2);

  const requestId1 = randomUUID();
  const requestId2 = randomUUID();

  createdClientRequestIds.push(requestId1, requestId2);

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-FILTER-1-${randomUUID()}`,
      requesterId: requester!.id,
      categoryId: categories[0].id,
      relatedSystemId: relatedSystems[0].id,
      summary: "High priority filtered ticket",
      description: "This Ticket should match the requested filters.",
      requestedPriority: "High",
      status: "New",
      clientRequestId: requestId1,
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-FILTER-2-${randomUUID()}`,
      requesterId: requester!.id,
      categoryId: categories[1].id,
      relatedSystemId: relatedSystems[1].id,
      summary: "Low priority other ticket",
      description: "This Ticket should not match the requested filters.",
      requestedPriority: "Low",
      status: "New",
      clientRequestId: requestId2,
    },
  });

  const res = await request(app)
    .get(
      `/api/v1/tickets?categoryId=${categories[0].id}` +
        `&relatedSystemId=${relatedSystems[0].id}` +
        `&requestedPriority=High&status=New`
    )
    .set("X-Development-Requester-Id", requester!.id);

  expect(res.status).toBe(200);

  expect(
    res.body.data.some(
      (ticket: { summary: string }) =>
        ticket.summary === "High priority filtered ticket"
    )
  ).toBe(true);

  expect(
    res.body.data.some(
      (ticket: { summary: string }) =>
        ticket.summary === "Low priority other ticket"
    )
  ).toBe(false);
});
it("sorts the selected Requester's Tickets by Ticket Number", async () => {
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

  const requestId1 = randomUUID();
  const requestId2 = randomUUID();
  const sortToken = randomUUID();

  createdClientRequestIds.push(requestId1, requestId2);

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-SORT-A-${sortToken}`,
      requesterId: requester!.id,
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: `Sorting test ${sortToken} A`,
      description: "First Ticket used for sorting verification.",
      requestedPriority: "Low",
      status: "New",
      clientRequestId: requestId1,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNo: `TEST-SORT-B-${sortToken}`,
      requesterId: requester!.id,
      categoryId: category!.id,
      relatedSystemId: relatedSystem!.id,
      summary: `Sorting test ${sortToken} B`,
      description: "Second Ticket used for sorting verification.",
      requestedPriority: "High",
      status: "New",
      clientRequestId: requestId2,
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
  });

  const res = await request(app)
    .get(
      `/api/v1/tickets?search=${sortToken}&sort=ticketNo&order=asc`
    )
    .set("X-Development-Requester-Id", requester!.id);

  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(2);

  expect(res.body.data[0].ticketNo).toBe(
    `TEST-SORT-A-${sortToken}`
  );

  expect(res.body.data[1].ticketNo).toBe(
    `TEST-SORT-B-${sortToken}`
  );
});
it("paginates the selected Requester's Tickets and returns metadata", async () => {
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

  const pageToken = randomUUID();

  for (let i = 1; i <= 12; i++) {
    const clientRequestId = randomUUID();
    createdClientRequestIds.push(clientRequestId);

    await prisma.ticket.create({
      data: {
        ticketNo: `TEST-PAGE-${pageToken}-${String(i).padStart(2, "0")}`,
        requesterId: requester!.id,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: `Pagination ${pageToken} ticket ${i}`,
        description: `Pagination test Ticket number ${i}.`,
        requestedPriority: "Medium",
        status: "New",
        clientRequestId,
      },
    });
  }

  const res = await request(app)
    .get(
      `/api/v1/tickets?search=${pageToken}` +
        `&sort=ticketNo&order=asc&page=2&pageSize=5`
    )
    .set("X-Development-Requester-Id", requester!.id);

  expect(res.status).toBe(200);

  expect(res.body.data).toHaveLength(5);

  expect(res.body.meta).toEqual({
    page: 2,
    pageSize: 5,
    totalItems: 12,
    totalPages: 3,
  });

  expect(res.body.data[0].ticketNo).toContain("-06");
  expect(res.body.data[4].ticketNo).toContain("-10");
});
});