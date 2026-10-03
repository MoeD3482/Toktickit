import { test, expect, Page } from "@playwright/test";

async function loginAsStaff(page: Page) {
  await page.goto("/");

  const email = "somchai.staff@example.com";
  const tempPassword = "ChangeMe123!";
  const stablePassword = "NewPass123";

  // Try the already-changed password first.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(stablePassword);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Already logged in with stable password.
  try {
    await expect(
      page.getByRole("heading", { name: "Staff Queue" })
    ).toBeVisible({ timeout: 3000 });

    return;
  } catch {
    // Continue with temporary password.
  }

  // First-time login uses the temporary password.
  await page.getByLabel("Password").fill(tempPassword);
  await page.getByRole("button", { name: "Sign In" }).click();

  const changePasswordHeading = page.getByRole("heading", {
    name: "Change Password",
  });

  try {
    await expect(changePasswordHeading).toBeVisible({ timeout: 5000 });

    await page.getByLabel("Current Password").fill(tempPassword);
    await page.getByLabel("New Password").fill(stablePassword);
    await page.getByLabel("Confirm Password").fill(stablePassword);
    await page.getByRole("button", { name: "Change Password" }).click();
  } catch {
    // Password was already changed.
  }

  await expect(
    page.getByRole("heading", { name: "Staff Queue" })
  ).toBeVisible();
}

test("E2E-06 IT Staff opens ticket queue and filters tickets", async ({
  page,
}) => {
  await loginAsStaff(page);

  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();
  await expect(page.getByLabel("IT Priority")).toBeVisible();

  await page.getByLabel("Search").fill("printer");
  await page.getByRole("button", { name: "Apply Filters" }).click();

  await expect(page.getByLabel("Search")).toHaveValue("printer");
});

test("E2E-07 IT Staff opens a ticket and views ticket controls", async ({
  page,
}) => {
  await loginAsStaff(page);

  const ticketButtons = page.locator(
    'button.btn-link.fw-bold'
  );

  await expect(ticketButtons.first()).toBeVisible();
  await ticketButtons.first().click();

  await expect(
    page.getByRole("heading", { name: /TKT-/ })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Staff Controls" })
  ).toBeVisible();

  await expect(page.getByLabel("Assignment")).toBeVisible();
  await expect(page.getByLabel("IT Priority")).toBeVisible();
  await expect(page.getByLabel("Next Status")).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Internal Notes" })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Actions and History" })
  ).toBeVisible();
});