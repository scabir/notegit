#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COVERAGE_THRESHOLD = 80;
const COVERAGE_FILE = path.resolve(
  process.cwd(),
  "coverage/coverage-final.json",
);
const DEFAULT_EXCLUDES_FILE = path.resolve(
  process.cwd(),
  "scripts/coverage-gate-excludes.json",
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

const normalizePathValue = (value) =>
  String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();

const readExcludesFromFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON in coverage exclude file ${filePath}: ${error.message}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Coverage exclude file ${filePath} must be a JSON array of file paths.`,
    );
  }

  return parsed
    .map((entry) => normalizePathValue(entry))
    .filter((entry) => entry.length > 0);
};

const readExcludesFromEnv = () => {
  const raw = process.env.COVERAGE_GATE_EXCLUDES || "";
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => normalizePathValue(entry))
    .filter((entry) => entry.length > 0);
};

const parseCliArgs = (argv) => {
  const options = {
    excludes: [],
    excludesFile: DEFAULT_EXCLUDES_FILE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--exclude") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --exclude");
      }
      options.excludes.push(normalizePathValue(nextValue));
      index += 1;
      continue;
    }

    if (arg.startsWith("--exclude=")) {
      options.excludes.push(normalizePathValue(arg.split("=", 2)[1]));
      continue;
    }

    if (arg === "--exclude-file") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --exclude-file");
      }
      options.excludesFile = path.resolve(process.cwd(), nextValue);
      index += 1;
      continue;
    }

    if (arg.startsWith("--exclude-file=")) {
      options.excludesFile = path.resolve(process.cwd(), arg.split("=", 2)[1]);
      continue;
    }

    if (arg === "--help") {
      console.log("Usage: node scripts/check-coverage-threshold.js [options]");
      console.log("");
      console.log(
        "  --exclude <path>         Exclude a file path from coverage gate",
      );
      console.log(
        "  --exclude-file <path>    Path to a JSON array file of excludes",
      );
      console.log("");
      console.log("Environment: COVERAGE_GATE_EXCLUDES=path1,path2,...");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.excludes = options.excludes.filter((entry) => entry.length > 0);
  return options;
};

const shouldExcludePath = (absolutePath, excludePaths) => {
  const normalizedAbsolute = normalizePathValue(absolutePath);
  const relativePath = normalizePathValue(
    path.relative(process.cwd(), absolutePath),
  );

  return excludePaths.some((entry) => {
    const normalizedEntry = normalizePathValue(entry);
    if (!normalizedEntry) {
      return false;
    }
    return (
      relativePath === normalizedEntry ||
      relativePath.endsWith(`/${normalizedEntry}`) ||
      normalizedAbsolute.endsWith(`/${normalizedEntry}`)
    );
  });
};

const main = () => {
  const cliOptions = parseCliArgs(process.argv.slice(2));
  const excludePaths = [
    ...readExcludesFromFile(cliOptions.excludesFile),
    ...readExcludesFromEnv(),
    ...cliOptions.excludes,
  ];

  const coverageMap = readCoverageMap();
  const violations = [];
  const candidateEntries = Object.entries(coverageMap).filter(
    ([absolutePath]) => {
      const normalizedPath = absolutePath.replace(/\\/g, "/");
      return (
        SOURCE_FILE_PATTERN.test(normalizedPath) &&
        !normalizedPath.endsWith(".d.ts") &&
        !normalizedPath.includes("/unit-tests/") &&
        !shouldExcludePath(absolutePath, excludePaths)
      );
    },
  );

  if (candidateEntries.length === 0) {
    console.log("No source files found in coverage report for coverage gate.");
    return;
  }

  if (excludePaths.length > 0) {
    console.log(`Coverage gate excludes: ${excludePaths.join(", ")}`);
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
