
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

import {
  cleanupLab4TicketFixture,
  createLab4TicketFixture,
} from "../helpers/lab4.js";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
];

const OUTPUT_DIR = "artifacts/lab-04/screenshots";

async function captureScreen(page: Page, screenName: string) {
  const screenDir = `${OUTPUT_DIR}/${screenName}`;
  const fileName = screenName.split("/").pop() ?? screenName;

  await mkdir(screenDir, { recursive: true });

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    await expect(page.locator("body")).toBeVisible();

    await page.screenshot({
      path: `${screenDir}/${fileName}-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }

  await page.setViewportSize(VIEWPORTS[0]);
}

async function login(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("Issue #9 captures Lab 4 screens at desktop, tablet and mobile sizes", async ({
  page,
}) => {
  const fixture = await createLab4TicketFixture(
    "Issue 9 screenshot verification ticket",
  );

  try {
    // 1. Login
    await page.goto("/");
    await expect(page.getByLabel("Email")).toBeVisible();
    await captureScreen(page, "login");

    // 2. Requester screens
    await login(
      page,
      fixture.requesterEmail,
      "E2E-Lab4-Requester-12345",
    );

    await expect(
      page.getByRole("heading", { name: "Create Ticket" }),
    ).toBeVisible();

    await captureScreen(page, "create-ticket");

    await page.getByRole("button", {
      name: "Dashboard",
      exact: true,
    }).click();

    await expect(
      page.getByRole("heading", { name: "Requester Dashboard" }),
    ).toBeVisible();

    await captureScreen(page, "requester-dashboard");

    await page.getByRole("button", {
      name: "My Tickets",
      exact: true,
    }).click();

    await expect(
      page.getByRole("heading", { name: "My Tickets" }),
    ).toBeVisible();

    await captureScreen(page, "my-tickets");

    await page.locator("#ticketSearch").fill(fixture.summary);
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(
      page.getByText(fixture.summary, { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", {
      name: fixture.ticketNo,
    }).click();

    await expect(
      page.getByRole("heading", { name: "Ticket Detail" }),
    ).toBeVisible();

    await captureScreen(page, "requester-ticket-detail");
    await captureScreen(page, "actions-taken/requester");

    // 3. IT Staff screens
    await page.getByRole("button", { name: "Sign Out" }).click();

    await login(page, "somchai.staff@example.com", "NewPass123");

    await expect(
      page.getByRole("button", {
        name: "Staff Dashboard",
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", {
      name: "Staff Dashboard",
      exact: true,
    }).click();

    await expect(
      page.getByRole("heading", { name: /Staff Dashboard/i }),
    ).toBeVisible();

    await captureScreen(page, "staff-dashboard");

    await page.getByRole("button", {
      name: "Staff Queue",
      exact: true,
    }).click();

    await expect(
      page.getByRole("heading", { name: "Staff Queue" }),
    ).toBeVisible();

    await captureScreen(page, "staff-queue");

    await page.getByLabel("Search").fill(fixture.ticketNo);
    await page.getByRole("button", { name: "Apply Filters" }).click();

    const ticketButton = page
      .locator("button.btn-link.fw-bold")
      .filter({ hasText: fixture.ticketNo });

    await expect(ticketButton).toBeVisible();
    await ticketButton.click();

    await expect(
      page.getByRole("heading", {
        name: fixture.ticketNo,
        exact: true,
      }),
    ).toBeVisible();

    await captureScreen(page, "staff-ticket-detail");
    await captureScreen(page, "actions-taken/staff");

    // 4. Administrator screens
    await page.getByRole("button", { name: "Sign Out" }).click();

    await login(page, "admin@example.com", "NewPass123");

    await expect(
      page.getByRole("button", {
        name: "Staff Dashboard",
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", {
      name: "User Management",
      exact: true,
    }).click();

    await expect(page.getByLabel("Search")).toBeVisible();

    await captureScreen(page, "admin-user-management");
  } finally {
    await cleanupLab4TicketFixture(
      fixture.ticketId,
      fixture.requesterId,
    );
  }
});
