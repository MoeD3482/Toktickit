
import { test, expect } from "@playwright/test";

import {
  cleanupLab4TicketFixture,
  createLab4TicketFixture,
  currentDateTimeLocal,
  openLab4TicketAsStaff,
} from "../helpers/lab4.js";

test("E2E-10 IT Staff records multiple Actions Taken on one Ticket", async ({
  page,
}) => {
  const fixture = await createLab4TicketFixture(
    "E2E verify multiple Actions Taken",
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

    await expect(
      actionsSection.getByRole("heading", {
        name: "Actions Taken",
      }),
    ).toBeVisible();

    // First Action Taken
    await actionsSection
      .getByRole("button", { name: "Add Action Taken" })
      .click();

    await actionsSection
      .getByLabel("Action Date/Time")
      .fill(currentDateTimeLocal());

    await actionsSection
      .getByLabel("Action Description")
      .fill("Checked network configuration.");

    await actionsSection
      .getByLabel("Result")
      .fill("Network configuration is correct.");

    await actionsSection
      .getByLabel("Attachment Notes")
      .fill("Network diagnostic report reviewed.");

    await actionsSection
      .getByRole("button", { name: "Record Action" })
      .click();

    await expect(
      actionsSection.getByText(
        "Action Taken recorded successfully.",
      ),
    ).toBeVisible();

    await expect(
      actionsSection.getByText(
        "Checked network configuration.",
      ),
    ).toBeVisible();

    // Second Action Taken on the same Ticket
    await actionsSection
      .getByRole("button", { name: "Add Action Taken" })
      .click();

    await actionsSection
      .getByLabel("Action Date/Time")
      .fill(currentDateTimeLocal());

    await actionsSection
      .getByLabel("Action Description")
      .fill("Verified the VPN connection.");

    await actionsSection
      .getByLabel("Result")
      .fill("VPN connection restored successfully.");

    await actionsSection
      .getByRole("button", { name: "Record Action" })
      .click();

    await expect(
      actionsSection.getByText(
        "Action Taken recorded successfully.",
      ),
    ).toBeVisible();

    await expect(
      actionsSection.getByText(
        "Checked network configuration.",
      ),
    ).toBeVisible();

    await expect(
      actionsSection.getByText(
        "Verified the VPN connection.",
      ),
    ).toBeVisible();

    await expect(
      actionsSection.getByText(
        "VPN connection restored successfully.",
      ),
    ).toBeVisible();

    await expect(
  actionsSection.getByText("Somchai IT Staff", {
    exact: true,
  }),
).toHaveCount(2);
  } finally {
    await cleanupLab4TicketFixture(
      fixture.ticketId,
      fixture.requesterId,
    );
  }
});
