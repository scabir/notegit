#!/usr/bin/env node

const {
  DEFAULT_MAX_FILE_BYTES,
  getStagedBlobBuffer,
  getStagedBlobSize,
  getStagedFiles,
  isAllowedBinaryPath,
  isBinaryContent,
} = require("./precommit-utils");

const rawLimit = process.env.PRECOMMIT_MAX_FILE_BYTES || "";
const maxBytes = Number.parseInt(rawLimit, 10);
const limit =
  Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : DEFAULT_MAX_FILE_BYTES;

const stagedFiles = getStagedFiles();
if (stagedFiles.length === 0) {
  process.exit(0);
}

const sizeViolations = [];
const binaryViolations = [];

for (const filePath of stagedFiles) {
  const size = getStagedBlobSize(filePath);
  if (size > limit) {
    sizeViolations.push({ filePath, size });
  }

  const contentBuffer = getStagedBlobBuffer(filePath);
  if (isBinaryContent(contentBuffer) && !isAllowedBinaryPath(filePath)) {
    binaryViolations.push(filePath);
  }
}

if (sizeViolations.length > 0 || binaryViolations.length > 0) {
  if (sizeViolations.length > 0) {
    console.error(`Staged files exceed size limit (${limit} bytes):`);
    sizeViolations.forEach(({ filePath, size }) =>
      console.error(`- ${filePath}: ${size} bytes`),
    );
  }
  if (binaryViolations.length > 0) {
    console.error(
      "Binary staged files are blocked outside allowed paths/extensions:",
    );
    binaryViolations.forEach((filePath) => console.error(`- ${filePath}`));
  }
  process.exit(1);
}
