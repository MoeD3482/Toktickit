import {
  expect,
  test,
  type Page,
} from "@playwright/test";

async function loginAsRequester(page: Page) {
  await page.goto("/");

  const email = "anan.chaiyasit@example.com";
  const currentPassword = "ChangeMe123!";
  const stablePassword = "NewPass123";

  await page
    .getByLabel("Email")
    .fill(email);

  await page
    .getByLabel("Password")
    .fill(stablePassword);

  await page
    .getByRole("button", {
      name: "Sign In",
    })
    .click();

  try {
    await expect(
      page.getByRole("heading", {
        name: "Create Ticket",
      })
    ).toBeVisible({ timeout: 3000 });

    return;
  } catch {
    // First login after a fresh seed uses the temporary password.
  }

  await page
    .getByLabel("Email")
    .fill(email);

  await page
    .getByLabel("Password")
    .fill(currentPassword);

  await page
    .getByRole("button", {
      name: "Sign In",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Change Password",
    })
  ).toBeVisible();

  await page
    .getByLabel("Current Password")
    .fill(currentPassword);

  await page
    .getByLabel("New Password")
    .fill(stablePassword);

  await page
    .getByLabel("Confirm Password")
    .fill(stablePassword);

  await page
    .getByRole("button", {
      name: "Change Password",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Create Ticket",
    })
  ).toBeVisible();
}

test(
  "E2E-01 Requester creates a Ticket and opens it from My Tickets",
  async ({ page }) => {
    await loginAsRequester(page);

    const uniqueValue =
      Date.now();

    const summary =
      `E2E VPN issue ${uniqueValue}`;

    const description =
      `Automated Lab 2 E2E Ticket created at ${uniqueValue} for Requester workflow verification.`;

    await page
      .locator("#category")
      .selectOption({
        index: 1,
      });

    await page
      .locator("#relatedSystem")
      .selectOption({
        index: 1,
      });

    await page
      .locator(
        "#requestedPriority"
      )
      .selectOption("High");

    await page
      .locator("#summary")
      .fill(summary);

    await page
      .locator("#description")
      .fill(description);

    await page
      .getByRole("button", {
        name: "Submit Ticket",
      })
      .click();

    await expect(
      page.getByText(
        "Ticket created successfully."
      )
    ).toBeVisible();

    const ticketNo =
      await page
        .locator("#ticketNumber")
        .inputValue();

    expect(ticketNo).toMatch(
      /^TKT-\d{4}-\d{5}$/
    );

    await page
      .getByRole("button", {
        name: "My Tickets",
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "My Tickets",
      })
    ).toBeVisible();

    await page
      .locator("#ticketSearch")
      .fill(summary);

    await page
      .getByRole("button", {
        name: "Apply",
      })
      .click();

    await expect(
      page.getByText(
        summary,
        {
          exact: true,
        }
      )
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: ticketNo,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Ticket Detail",
      })
    ).toBeVisible();

    await expect(
      page.locator(
        `input[value="${summary}"]`
      )
    ).toBeVisible();
  }
);