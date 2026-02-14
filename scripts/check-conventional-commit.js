#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COMMIT_MSG_FILE = process.argv[2];
const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .+/;

if (!COMMIT_MSG_FILE) {
  console.error(
    "Missing commit message file path. Usage: node scripts/check-conventional-commit.js <path>",
  );
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), COMMIT_MSG_FILE);
if (!fs.existsSync(absolutePath)) {
  console.error(`Commit message file not found: ${absolutePath}`);
  process.exit(1);
}

const firstLine = fs
  .readFileSync(absolutePath, "utf8")
  .split(/\r?\n/, 1)[0]
  .trim();

if (!CONVENTIONAL_COMMIT_REGEX.test(firstLine)) {
  console.error(
    `Invalid commit message: "${firstLine || "(empty)"}". Expected Conventional Commit format, e.g. "feat: add feature".`,
  );
  process.exit(1);
}
