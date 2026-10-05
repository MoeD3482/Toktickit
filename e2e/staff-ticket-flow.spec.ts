import { test, expect, Page } from "@playwright/test";

async function loginAsStaff(page: Page) {
  await page.goto("/");

  const email = "somchai.staff@example.com";
  const tempPassword = "ChangeMe123!";
  const stablePassword = "NewPass123";

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(tempPassword);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/auth/login") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Sign In" }).click();

  const loginResponse = await loginResponsePromise;


  const changePasswordHeading = page.getByRole("heading", {
    name: "Change Password",
  });

  if (await changePasswordHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByLabel("Current Password").fill(tempPassword);
    await page.getByLabel("New Password").fill(stablePassword);
    await page.getByLabel("Confirm Password").fill(stablePassword);

    await page.getByRole("button", { name: "Change Password" }).click();

    await expect(
      page.getByRole("heading", { name: "Staff Queue" })
    ).toBeVisible({ timeout: 10000 });

    return;
  }

  // If the password was already changed, login with stable password.
  if (await page.getByRole("heading", { name: "TokTickIT" }).isVisible().catch(() => false)) {
    await page.getByLabel("Password").fill(stablePassword);

    const secondLoginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/auth/login") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Sign In" }).click();

    const secondLoginResponse = await secondLoginResponsePromise;

   
  }

  await expect(
    page.getByRole("heading", { name: "Staff Queue" })
  ).toBeVisible({ timeout: 10000 });
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

  const ticketButtons = page.locator("button.btn-link.fw-bold");

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