#!/usr/bin/env node

const {
  evaluateLockfileConsistency,
  getStagedFiles,
} = require("./precommit-utils");

const stagedFiles = getStagedFiles();
const result = evaluateLockfileConsistency(stagedFiles);

if (!result.ok) {
  console.error(result.reason);
  process.exit(1);
}
