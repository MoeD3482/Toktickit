import {
  defineConfig,
  devices,
} from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,
  workers: 1,

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL:
      "http://127.0.0.1:5173",
    trace:
      "retain-on-failure",
    screenshot:
      "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices[
          "Desktop Chrome"
        ],
      },
    },
  ],

  webServer: [
    {
      command:
        "npm --prefix server run dev",

      url:
        "http://127.0.0.1:3000/api/health",

      reuseExistingServer: true,

      timeout: 120_000,

      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    },

    {
      command:
        "npm --prefix client run dev -- --host 127.0.0.1",

      url:
        "http://127.0.0.1:5173",

      reuseExistingServer: true,

      timeout: 120_000,
    },
  ],
});