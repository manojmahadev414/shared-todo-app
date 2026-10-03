import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
Object.assign(process.env, {
  BETTER_AUTH_URL: "http://localhost:3100",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "2525",
  SMTP_SECURE: "false",
  SMTP_USER: "e2e",
  SMTP_PASSWORD: "e2e",
  SMTP_FROM: "Shared To-Do E2E <test@example.test>",
});

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
    command: "node e2e/start-server.mjs",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
