#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const gitRoot = (() => {
  let current = projectRoot;
  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
})();

if (!gitRoot) {
  console.log("husky: skipping install (.git not found)");
  process.exit(0);
}

const huskyBin = path.join(
  projectRoot,
  "node_modules",
  "husky",
  "lib",
  "bin.js",
);
if (!fs.existsSync(huskyBin)) {
  console.log("husky: skipping install (husky binary not found)");
  process.exit(0);
}

const hooksDir = path
  .relative(gitRoot, path.join(projectRoot, ".husky"))
  .replace(/\\/g, "/");

const result = spawnSync(process.execPath, [huskyBin, "install", hooksDir], {
  cwd: gitRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
