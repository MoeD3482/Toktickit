import { test, expect, Page } from "@playwright/test";



async function loginAsStaff(page: Page) {
  await page.goto("/");

  await page.getByLabel("Email").fill("somchai.staff@example.com");
  await page.getByLabel("Password").fill("NewPass123");
  await page.getByRole("button", { name: "Sign In" }).click();

  const dashboardButton = page.getByRole("button", {
    name: "Staff Dashboard",
  });

  await expect(dashboardButton).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Staff Queue" }).click();

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

const firstTicket = ticketButtons.first();

await expect(firstTicket).toBeVisible();

const ticketNo = (await firstTicket.innerText()).trim();

await firstTicket.click();

await expect(
  page.getByRole("heading", {
    name: ticketNo,
    exact: true,
  })
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