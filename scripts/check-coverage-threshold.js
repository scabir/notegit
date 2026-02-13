#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COVERAGE_THRESHOLD = 80;
const COVERAGE_FILE = path.resolve(
  process.cwd(),
  "coverage/coverage-final.json",
);

const SOURCE_FILE_PATTERN = /\/src\/(backend|frontend)\/.+\.(ts|tsx|js|jsx)$/;

const readCoverageMap = () => {
  if (!fs.existsSync(COVERAGE_FILE)) {
    throw new Error(`Coverage report not found at ${COVERAGE_FILE}`);
  }
  return JSON.parse(fs.readFileSync(COVERAGE_FILE, "utf8"));
};

const computeStatementCoverage = (coverageEntry) => {
  const statements = Object.values(coverageEntry?.s || {});
  if (statements.length === 0) {
    return 0;
  }
  const covered = statements.filter((count) => count > 0).length;
  return (covered / statements.length) * 100;
};

const main = () => {
  const coverageMap = readCoverageMap();
  const violations = [];
  const candidateEntries = Object.entries(coverageMap).filter(
    ([absolutePath]) => {
      const normalizedPath = absolutePath.replace(/\\/g, "/");
      return (
        SOURCE_FILE_PATTERN.test(normalizedPath) &&
        !normalizedPath.endsWith(".d.ts") &&
        !normalizedPath.includes("/unit-tests/")
      );
    },
  );

  if (candidateEntries.length === 0) {
    console.log("No source files found in coverage report for coverage gate.");
    return;
  }

  for (const [absoluteFilePath, coverageEntry] of candidateEntries) {
    const statementCoverage = computeStatementCoverage(coverageEntry);
    if (statementCoverage < COVERAGE_THRESHOLD) {
      violations.push({
        filePath: path
          .relative(process.cwd(), absoluteFilePath)
          .replace(/\\/g, "/"),
        coverage: statementCoverage,
        reason: "below threshold",
      });
    }
  }

  if (violations.length === 0) {
    console.log(
      `All source files meet ${COVERAGE_THRESHOLD}% statement coverage.`,
    );
    return;
  }

  console.error(
    `Coverage gate failed. Source files must have >= ${COVERAGE_THRESHOLD}% statement coverage:`,
  );
  for (const violation of violations) {
    console.error(
      `- ${violation.filePath}: ${violation.coverage.toFixed(2)}% (${violation.reason})`,
    );
  }
  process.exit(1);
};

main();
