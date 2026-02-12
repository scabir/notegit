#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_THRESHOLD = 80;
const COVERAGE_FILE = path.resolve(process.cwd(), 'coverage/coverage-final.json');

const SOURCE_FILE_PATTERN = /^src\/(backend|frontend|electron)\/.+\.(ts|tsx|js|jsx)$/;

const getStagedSourceFiles = () => {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
    .filter((filePath) => !filePath.endsWith('.d.ts'))
    .filter((filePath) => !filePath.includes('/unit-tests/'));
};

const readCoverageMap = () => {
  if (!fs.existsSync(COVERAGE_FILE)) {
    throw new Error(`Coverage report not found at ${COVERAGE_FILE}`);
  }
  return JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
};

const toAbsoluteFilePath = (relativePath) =>
  path.resolve(process.cwd(), relativePath).replace(/\\/g, '/');

const computeStatementCoverage = (coverageEntry) => {
  const statements = Object.values(coverageEntry?.s || {});
  if (statements.length === 0) {
    return 0;
  }
  const covered = statements.filter((count) => count > 0).length;
  return (covered / statements.length) * 100;
};

const main = () => {
  const stagedSourceFiles = getStagedSourceFiles();
  if (stagedSourceFiles.length === 0) {
    console.log('No staged source files requiring coverage check.');
    return;
  }

  const coverageMap = readCoverageMap();
  const violations = [];

  for (const relativeFilePath of stagedSourceFiles) {
    const normalizedAbsolutePath = toAbsoluteFilePath(relativeFilePath);
    const coverageEntry = coverageMap[normalizedAbsolutePath];

    if (!coverageEntry) {
      violations.push({
        filePath: relativeFilePath,
        coverage: null,
        reason: 'missing coverage data',
      });
      continue;
    }

    const statementCoverage = computeStatementCoverage(coverageEntry);
    if (statementCoverage < COVERAGE_THRESHOLD) {
      violations.push({
        filePath: relativeFilePath,
        coverage: statementCoverage,
        reason: 'below threshold',
      });
    }
  }

  if (violations.length === 0) {
    console.log(`Staged source files meet ${COVERAGE_THRESHOLD}% statement coverage.`);
    return;
  }

  console.error(
    `Coverage gate failed. Staged source files must have >= ${COVERAGE_THRESHOLD}% statement coverage:`
  );
  for (const violation of violations) {
    if (violation.coverage === null) {
      console.error(`- ${violation.filePath}: ${violation.reason}`);
      continue;
    }
    console.error(`- ${violation.filePath}: ${violation.coverage.toFixed(2)}% (${violation.reason})`);
  }
  process.exit(1);
};

main();

