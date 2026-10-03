import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
process.env.PLAYWRIGHT_TEST = "true";
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASSWORD = "";
process.env.SMTP_FROM = "";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PLAYWRIGHT_TEST: "true",
      BETTER_AUTH_URL: "http://localhost:3100",
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM: "",
    },
  },
});
