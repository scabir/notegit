#!/usr/bin/env node

const {
  findSecretMatches,
  getStagedBlobBuffer,
  getStagedFiles,
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
  const matches = findSecretMatches(content);
  if (matches.length > 0) {
    violations.push({ filePath, matches });
  }
}

if (violations.length > 0) {
  console.error("Potential secrets detected in staged content:");
  violations.forEach(({ filePath, matches }) =>
    console.error(`- ${filePath}: ${matches.join(", ")}`),
  );
  process.exit(1);
}
