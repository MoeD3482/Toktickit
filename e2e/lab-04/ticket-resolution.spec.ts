
import { test, expect } from "@playwright/test";

import {
  cleanupLab4TicketFixture,
  createLab4TicketFixture,
  currentDateTimeLocal,
  openLab4TicketAsStaff,
} from "../helpers/lab4.js";

test("E2E-11 Ticket resolution requires a completed Action Taken", async ({
  page,
}) => {
  const fixture = await createLab4TicketFixture(
    "E2E verify Ticket resolution gate",
  );

  const actionsSection = page.locator(
    'section[aria-labelledby="actions-taken-title"]',
  );

  try {
    await openLab4TicketAsStaff(
      page,
      fixture.ticketNo,
      fixture.summary,
    );

    const statusSelect = page.getByLabel("Next Status");

    // New -> Open
    await statusSelect.selectOption("Open");

    await page
      .getByRole("button", { name: "Update Status" })
      .click();

    await expect(
      page.getByText("Status updated.", { exact: true }),
    ).toBeVisible();

    // Open -> InProgress
    await statusSelect.selectOption("InProgress");

    await page
      .getByRole("button", { name: "Update Status" })
      .click();

    await expect(
      page.getByText("Status updated.", { exact: true }),
    ).toBeVisible();

    // Reject resolution without Action Taken
    await statusSelect.selectOption("Resolved");

    await page
      .getByRole("button", { name: "Update Status" })
      .click();

    await expect(
      page.getByText(
        "Create an Action Taken before resolving this Ticket.",
      ),
    ).toBeVisible();

    // Add a completed Action Taken
    await actionsSection
      .getByRole("button", { name: "Add Action Taken" })
      .click();

    await actionsSection
      .getByLabel("Action Date/Time")
      .fill(currentDateTimeLocal());

    await actionsSection
      .getByLabel("Action Description")
      .fill("Repaired and verified the VPN service.");

    await actionsSection
      .getByLabel("Result")
      .fill("VPN service restored and verified.");

    // Follow-Up Required remains unchecked.
    await actionsSection
      .getByRole("button", { name: "Record Action" })
      .click();

    await expect(
      actionsSection.getByText(
        "Action Taken recorded successfully.",
      ),
    ).toBeVisible();

    // Resolution is now permitted.
    await statusSelect.selectOption("Resolved");

    await page
      .getByRole("button", { name: "Update Status" })
      .click();

    await expect(
      page.getByText("Status updated.", { exact: true }),
    ).toBeVisible();

    await expect(
      page.locator("span.badge").filter({
        hasText: /^Resolved$/,
      }),
    ).toBeVisible();

    await expect(
      actionsSection.getByText(
        "Repaired and verified the VPN service.",
      ),
    ).toBeVisible();
  } finally {
    await cleanupLab4TicketFixture(
      fixture.ticketId,
      fixture.requesterId,
    );
  }
});
