#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const rawArgs = process.argv.slice(2);
const extraArgs = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const playwrightArgs = [
  "exec",
  "playwright",
  "test",
  "-c",
  "playwright.integration.config.ts",
  ...extraArgs,
];

const hasCommand = (command) => {
  const probe = spawnSync("sh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return probe.status === 0;
};

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
};

const hasDisplay =
  Boolean(process.env.DISPLAY && process.env.DISPLAY.trim().length > 0) ||
  Boolean(
    process.env.WAYLAND_DISPLAY &&
    process.env.WAYLAND_DISPLAY.trim().length > 0,
  );

if (process.platform === "linux" && !hasDisplay) {
  if (!hasCommand("xvfb-run")) {
    console.error(
      "Headless Linux integration tests require xvfb-run when no display is available.",
    );
    console.error(
      "Install xvfb (for example: sudo apt-get install -y xvfb) or run with DISPLAY set.",
    );
    process.exit(1);
  }

  run("xvfb-run", ["-a", pnpmCmd, ...playwrightArgs]);
} else {
  run(pnpmCmd, playwrightArgs);
}
