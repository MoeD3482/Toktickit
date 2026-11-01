import { test, expect, Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("NewPass123");
  await page.getByRole("button", { name: "Sign In" }).click();
  const dashboardButton = page.getByRole("button", {
    name: "Staff Dashboard",
  });
  await expect(dashboardButton).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "User Management" }).click();
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