import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  cleanupLab4TicketFixture,
  createLab4TicketFixture,
} from "../helpers/lab4.js";

async function verifyAccessibility(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = result.violations.map((item) => ({
    id: item.id,
    impact: item.impact,
    description: item.help,
    affectedElements: item.nodes.map((node) => node.target),
  }));

  expect(violations).toEqual([]);
}

async function verifyResponsive(page: import("@playwright/test").Page) {
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
      `Horizontal overflow at viewport ${viewport.width}px`,
    ).toBeLessThanOrEqual(1);

    await verifyAccessibility(page);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
}

test("E2E-13 accessibility and responsive audit of Staff Dashboard and Ticket Detail", async ({
  page,
}) => {
  const fixture = await createLab4TicketFixture(
    "Lab 4 accessibility and responsive audit",
  );

  try {
    await page.goto("/");
    await page.getByLabel("Email").fill("somchai.staff@example.com");
    await page.getByLabel("Password").fill("NewPass123");
    await page.getByRole("button", { name: "Sign In" }).click();

    const dashboardNavigation = page.getByRole("button", {
      name: "Staff Dashboard",
      exact: true,
    });

    await expect(dashboardNavigation).toBeVisible({ timeout: 15000 });
    await dashboardNavigation.click();

    await expect(
      page.getByRole("heading", { name: /Staff Dashboard/i }),
    ).toBeVisible();

    await verifyResponsive(page);

    await page.getByRole("button", {
      name: "Staff Queue",
      exact: true,
    }).click();

    await expect(
      page.getByRole("heading", { name: "Staff Queue" }),
    ).toBeVisible();

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

    // Audits the Staff Controls, Actions Taken and Ticket Workflow UI.
    await verifyResponsive(page);

    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  } finally {
    await cleanupLab4TicketFixture(
      fixture.ticketId,
      fixture.requesterId,
    );
  }
});
