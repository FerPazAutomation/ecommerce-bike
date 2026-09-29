import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: [["html"], ["list"]],
  retries: process.env.CI ? 1 : 0,
  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      use: { baseURL: "http://127.0.0.1:8000" },
      testMatch: /api\/.*\.spec\.ts/,
    },
    {
      name: "ui",
      use: { baseURL: "http://localhost:5173" },
      testMatch: /ui\/.*\.spec\.ts/,
    },
  ],
});