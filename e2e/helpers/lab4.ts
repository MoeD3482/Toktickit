
import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { getPrisma } from "../../server/src/prisma.js";
import { hashPassword } from "../../server/src/auth/password.js";

const STAFF_EMAIL = "somchai.staff@example.com";
const STAFF_PASSWORD = "NewPass123";

export async function createLab4TicketFixture(summary: string) {
  const prisma = getPrisma();

  const staff = await prisma.user.findUniqueOrThrow({
    where: { email: STAFF_EMAIL },
    select: { id: true },
  });

  const email = `e2e-lab4-${randomUUID()}@example.com`;

  const requester = await prisma.user.create({
    data: {
      displayName: "E2E Lab 4 Requester",
      email,
      passwordHash: await hashPassword("E2E-Lab4-Requester-12345"),
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    },
  });

  try {
    await prisma.developmentRequester.create({
      data: {
        id: requester.id,
        displayName: requester.displayName,
        email: requester.email,
        isActive: true,
      },
    });

    const [category, relatedSystem] = await Promise.all([
      prisma.category.findFirstOrThrow({
        where: { isActive: true },
      }),
      prisma.relatedSystem.findFirstOrThrow({
        where: { isActive: true },
      }),
    ]);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: `E2E-L4-${randomUUID()}`,
        requesterId: requester.id,
        requesterUserId: requester.id,
        assignedToUserId: staff.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary,
        description: "Ticket created for Lab 4 E2E verification.",
        requestedPriority: "High",
        status: "New",
        clientRequestId: randomUUID(),
      },
    });

    return {
      requesterId: requester.id,
      ticketId: ticket.id,
      ticketNo: ticket.ticketNo,
      summary,
    };
  } catch (error) {
    await prisma.developmentRequester.deleteMany({
      where: { id: requester.id },
    });

    await prisma.user.deleteMany({
      where: { id: requester.id },
    });

    throw error;
  }
}

export async function cleanupLab4TicketFixture(
  ticketId: string,
  requesterId: string,
) {
  const prisma = getPrisma();

  await prisma.actionTaken.deleteMany({
    where: { ticketId },
  });

  await prisma.ticketAction.deleteMany({
    where: { ticketId },
  });

  await prisma.ticketComment.deleteMany({
    where: { ticketId },
  });

  await prisma.internalNote.deleteMany({
    where: { ticketId },
  });

  await prisma.attachment.deleteMany({
    where: { ticketId },
  });

  await prisma.ticket.deleteMany({
    where: { id: ticketId },
  });

  await prisma.developmentRequester.deleteMany({
    where: { id: requesterId },
  });

  await prisma.user.deleteMany({
    where: { id: requesterId },
  });
}

export async function openLab4TicketAsStaff(
  page: Page,
  ticketNo: string,
  summary: string,
) {
  await page.goto("/");

  await page.getByLabel("Email").fill(STAFF_EMAIL);
  await page.getByLabel("Password").fill(STAFF_PASSWORD);

  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(
    page.getByRole("button", { name: "Staff Dashboard" }),
  ).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Staff Queue" }).click();

  await expect(
    page.getByRole("heading", { name: "Staff Queue" }),
  ).toBeVisible();

  await page.getByLabel("Search").fill(ticketNo);

  await page.getByRole("button", {
    name: "Apply Filters",
  }).click();

  const ticketButton = page
    .locator("button.btn-link.fw-bold")
    .filter({ hasText: ticketNo });

  await expect(ticketButton).toBeVisible();
  await ticketButton.click();

  await expect(
    page.getByRole("heading", {
      name: ticketNo,
      exact: true,
    }),
  ).toBeVisible();

  await expect(page.getByText(summary)).toBeVisible();
}

export function currentDateTimeLocal() {
  const date = new Date();

  date.setMinutes(date.getMinutes() - 2);

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}
