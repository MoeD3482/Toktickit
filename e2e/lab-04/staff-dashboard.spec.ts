import { expect, test } from "@playwright/test";

import {
  cleanupLab4TicketFixture,
  createLab4TicketFixture,
} from "../helpers/lab4.js";

const STAFF_EMAIL = "somchai.staff@example.com";
const STAFF_PASSWORD = "NewPass123";

async function openStaffDashboard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill(STAFF_EMAIL);
  await page.getByLabel("Password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  const dashboardNavigation = page.getByRole("button", {
  name: "Staff Dashboard",
  exact: true,
});
  await expect(dashboardNavigation).toBeVisible({ timeout: 15000 });

  const startedAt = Date.now();
  await dashboardNavigation.click();

  await expect(
    page.getByRole("heading", { name: /Staff Dashboard/i }),
  ).toBeVisible();

  return Date.now() - startedAt;
}

test("E2E-12 Staff Dashboard drill-down, responsive layout, keyboard access and performance smoke", async ({
  page,
}) => {
  const fixture = await createLab4TicketFixture(
    "E2E Lab 4 Staff Dashboard drill-down verification",
  );

  try {
    const dashboardLoadMs = await openStaffDashboard(page);

    console.log(`Staff Dashboard visible after navigation in ${dashboardLoadMs} ms`);
    expect(dashboardLoadMs).toBeLessThan(5000);

    // Confirm the assigned Ticket is represented by the Staff Dashboard.
    await expect(
      page.getByText(fixture.summary, { exact: true }),
    ).toBeVisible();

    // Verify actionable My Tickets metric opens the Staff Queue.
    const myTicketsButton = page.getByRole("button", {
      name: /my tickets/i,
    }).first();

    await expect(myTicketsButton).toBeVisible();
    await myTicketsButton.click();

    await expect(
      page.getByRole("heading", { name: "Staff Queue" }),
    ).toBeVisible();

    await expect(
      page.locator("button.btn-link.fw-bold").filter({
        hasText: fixture.ticketNo,
      }),
    ).toBeVisible();

    // Return to the dashboard for viewport and accessibility checks.
    await page.getByRole("button", { name: "Staff Dashboard", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /Staff Dashboard/i }),
    ).toBeVisible();

    // Check the page does not introduce horizontal overflow at common widths.
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );

      expect(
        overflow,
        `Unexpected horizontal overflow at ${viewport.width}px`,
      ).toBeLessThanOrEqual(1);
    }

    // Check that visible buttons have accessible names.
    const unnamedButtons = await page.locator("button").evaluateAll((buttons) =>
      buttons.filter((button) => {
        const label = button.getAttribute("aria-label")?.trim();
        const title = button.getAttribute("title")?.trim();
        const text = button.textContent?.trim();
        return !label && !title && !text;
      }).length,
    );

    expect(unnamedButtons).toBe(0);

    // Check keyboard navigation can reach a visible control.
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  } finally {
    await cleanupLab4TicketFixture(
      fixture.ticketId,
      fixture.requesterId,
    );
  }
});

