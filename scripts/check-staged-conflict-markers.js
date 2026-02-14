#!/usr/bin/env node

const {
  getStagedBlobBuffer,
  getStagedFiles,
  hasConflictMarkers,
  isBinaryContent,
} = require("./precommit-utils");

const stagedFiles = getStagedFiles();
if (stagedFiles.length === 0) {
  process.exit(0);
}

const violations = [];

for (const filePath of stagedFiles) {
  const contentBuffer = getStagedBlobBuffer(filePath);
  if (isBinaryContent(contentBuffer)) {
    continue;
  }
  const content = contentBuffer.toString("utf8");
  if (hasConflictMarkers(content)) {
    violations.push(filePath);
  }
}

if (violations.length > 0) {
  console.error("Merge conflict markers detected in staged content:");
  violations.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}
