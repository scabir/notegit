import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./integration-tests",
  fullyParallel: true,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
});
