
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

import { ensureE2ERequester } from "./helpers/requester.js";

async function loginAsRequester(page: Page) {
  const requester = await ensureE2ERequester();

  await page.goto("/");

  await page.getByLabel("Email").fill(requester.email);
  await page.getByLabel("Password").fill(requester.password);

  await page.getByRole("button", {
    name: "Sign In",
  }).click();

  await expect(
    page.getByRole("heading", {
      name: "Create Ticket",
    })
  ).toBeVisible();
}

test("E2E-04 authentication login and logout", async ({ page }) => {
  await loginAsRequester(page);

  await page.getByRole("button", {
    name: "Sign Out",
  }).click();

  await expect(
    page.getByRole("heading", {
      name: "TokTickIT",
    })
  ).toBeVisible();
});

test("E2E-05 invalid login shows safe error", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Email").fill("invalid@example.com");
  await page.getByLabel("Password").fill("WrongPassword123");

  await page.getByRole("button", {
    name: "Sign In",
  }).click();

  await expect(
    page.getByText("Email or password is incorrect.")
  ).toBeVisible();

  await expect(
    page.getByText(/passwordHash/i)
  ).not.toBeVisible();
});
