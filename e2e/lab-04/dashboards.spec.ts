
import AxeBuilder from "@axe-core/playwright";

import {
  expect,
  test,
  type Page,
} from "@playwright/test";

import { randomUUID } from "node:crypto";
import { getPrisma } from "../../server/src/prisma.js";
import { hashPassword } from "../../server/src/auth/password.js";

const TEST_PASSWORD = "E2E-Requester-12345";

async function createRequesterFixture() {
  const prisma = getPrisma();
  const email = `e2e-requester-${randomUUID()}@example.com`;

  const user = await prisma.user.create({
    data: {
      displayName: "E2E Dashboard Requester",
      email,
      passwordHash: await hashPassword(TEST_PASSWORD),
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    },
  });

  try {
    await prisma.developmentRequester.create({
      data: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        isActive: true,
      },
    });
  } catch (error) {
    await prisma.user.delete({
      where: { id: user.id },
    });

    throw error;
  }

  return {
    id: user.id,
    email,
  };
}

async function cleanupRequesterFixture(userId: string) {
  const prisma = getPrisma();

  await prisma.developmentRequester.deleteMany({
    where: { id: userId },
  });

  await prisma.user.deleteMany({
    where: { id: userId },
  });
}

async function loginAsRequester(page: Page, email: string) {
  await page.goto("/");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);

  await page.getByRole("button", {
    name: "Sign In",
  }).click();

  await expect(
    page.getByRole("heading", {
      name: "Create Ticket",
    })
  ).toBeVisible();
}

test(
  "E2E-04 Requester Dashboard renders metrics, passes accessibility, and drills into My Tickets",
  async ({ page }) => {
    const requester = await createRequesterFixture();

    try {
      await loginAsRequester(page, requester.email);

      await page.getByRole("button", {
        name: "Dashboard",
      }).click();

      await expect(
        page.getByRole("heading", {
          name: "Requester Dashboard",
        })
      ).toBeVisible();

      // Accessibility audit for the Requester Dashboard.
      const accessibilityScan = await new AxeBuilder({ page })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
        ])
        .analyze();

      expect(accessibilityScan.violations).toEqual([]);

      // Verify that all four dashboard metric buttons are rendered.
      const metricButtons = page.locator(
        'section[aria-labelledby="requester-dashboard-heading"] button'
      );

      await expect(metricButtons).toHaveCount(4);

      for (let index = 0; index < 4; index += 1) {
        await expect(metricButtons.nth(index)).toBeVisible();
      }

      // The first metric is Open Tickets.
      await metricButtons.first().click();

      await expect(
        page.getByRole("heading", {
          name: "My Tickets",
        })
      ).toBeVisible();

      await expect(
        page.getByText("Dashboard filter: open Tickets")
      ).toBeVisible();
    } finally {
      await cleanupRequesterFixture(requester.id);
    }
  }
);
