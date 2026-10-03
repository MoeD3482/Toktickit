import { test, expect, Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/");

  const email = "admin@example.com";
  const tempPassword = "ChangeMe123!";
  const stablePassword = "NewPass123";

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(stablePassword);
  await page.getByRole("button", { name: "Sign In" }).click();

  try {
    await expect(
      page.getByRole("heading", { name: "User Management" })
    ).toBeVisible({ timeout: 3000 });

    return;
  } catch {
    // Try temporary password.
  }

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
    page.getByRole("heading", { name: "User Management" })
  ).toBeVisible();
}

test("E2E-08 Administrator opens user management and filters users", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page.getByLabel("Role")).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();
  await expect(page.getByLabel("Sort")).toBeVisible();
  await expect(page.getByLabel("Order")).toBeVisible();

  await page.getByLabel("Search").fill("somchai");

  await expect(page.getByLabel("Search")).toHaveValue("somchai");

  await page.getByLabel("Role").selectOption("ITStaff");
 await page.getByLabel("Status").selectOption("true");

  await expect(page.getByLabel("Role")).toHaveValue("ITStaff");
  await expect(page.getByLabel("Status")).toHaveValue("true");
});

test("E2E-09 Administrator opens create user workflow", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Create User" }).click();

  await expect(
    page.getByRole("heading", { name: /Create User/i })
  ).toBeVisible();
});