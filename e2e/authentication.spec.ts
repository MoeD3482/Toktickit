
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

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(stablePassword);
  await page.getByRole("button", { name: "Sign In" }).click();

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

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(currentPassword);
  await page.getByRole("button", { name: "Sign In" }).click();

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

test("E2E-04 authentication login and logout", async ({ page }) => {
  await loginAsRequester(page);

  await page
    .getByRole("button", {
      name: "Sign Out",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "TokTickIT",
    })
  ).toBeVisible();
});

test("E2E-05 invalid login shows safe error", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Email")
    .fill("invalid@example.com");

  await page
    .getByLabel("Password")
    .fill("WrongPassword123");

  await page
    .getByRole("button", {
      name: "Sign In",
    })
    .click();

  await expect(
    page.getByText(
      "Email or password is incorrect."
    )
  ).toBeVisible();

  await expect(
    page.getByText(/passwordHash/i)
  ).not.toBeVisible();
});
