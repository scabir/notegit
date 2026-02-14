#!/usr/bin/env node

const { spawnSync } = require("child_process");
const {
  getStagedFiles,
  resolveRelatedUnitTests,
  shouldRunUnitTests,
} = require("./precommit-utils");

const stagedFiles = getStagedFiles();
if (!shouldRunUnitTests(stagedFiles)) {
  console.log("No staged source files requiring unit tests.");
  process.exit(0);
}

const relatedTests = resolveRelatedUnitTests(stagedFiles);
if (relatedTests.length === 0) {
  console.log("No related unit tests found for staged source files.");
  process.exit(0);
}

console.log(`Running related unit tests (${relatedTests.length}):`);
relatedTests.forEach((testPath) => console.log(`- ${testPath}`));

const runResult = spawnSync("pnpm", ["run", "test", "--", ...relatedTests], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (runResult.status !== 0) {
  process.exit(runResult.status || 1);
}
