#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "overrides",
  "resolutions",
];
const LOCKFILES = [
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
];
const PROJECT_DIRECTORY_PREFIX = "app/desktop/";
const ALLOWED_BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".icns",
  ".pdf",
]);
const ALLOWED_BINARY_PATH_PREFIXES = [
  "src/electron/resources/",
  "docs/assets/",
];
const SECRET_PATTERNS = [
  { name: "aws-access-key-id", regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: "github-token", regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  {
    name: "private-key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
  },
  { name: "slack-token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "google-api-key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  {
    name: "jwt",
    regex:
      /(?:^|[^A-Za-z0-9_-])(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,})(?:$|[^A-Za-z0-9_-])/g,
  },
];

const normalizeGitPath = (filePath) =>
  String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();

const toProjectRelativePath = (filePath) => {
  const normalized = normalizeGitPath(filePath);
  if (normalized.startsWith(PROJECT_DIRECTORY_PREFIX)) {
    return normalized.slice(PROJECT_DIRECTORY_PREFIX.length);
  }
  return normalized;
};

const existsInProject = (filePath, existsFn = fs.existsSync) =>
  existsFn(filePath) || existsFn(`${PROJECT_DIRECTORY_PREFIX}${filePath}`);

const isPackageManifestPath = (filePath) => {
  const normalized = toProjectRelativePath(filePath);
  return (
    normalized === "package.json" ||
    (normalized.endsWith("/package.json") &&
      !normalized.includes("node_modules/"))
  );
};

const parseGitFileList = (output) =>
  String(output || "")
    .split(/\r?\n/)
    .map((line) => normalizeGitPath(line))
    .filter((line) => line.length > 0);

const getStagedFiles = () => {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  );
  return parseGitFileList(output);
};

const getStagedBlobBuffer = (filePath) =>
  execFileSync("git", ["show", `:${normalizeGitPath(filePath)}`]);

const getStagedBlobSize = (filePath) => {
  const output = execFileSync(
    "git",
    ["cat-file", "-s", `:${normalizeGitPath(filePath)}`],
    { encoding: "utf8" },
  );
  return Number.parseInt(output.trim(), 10);
};

const getHeadBlobBuffer = (filePath) => {
  try {
    return execFileSync("git", ["show", `HEAD:${normalizeGitPath(filePath)}`]);
  } catch (_error) {
    return null;
  }
};

const isBinaryContent = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return false;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }
    const isCommonWhitespace = byte === 9 || byte === 10 || byte === 13;
    const isPrintableAscii = byte >= 32 && byte <= 126;
    if (!isPrintableAscii && !isCommonWhitespace) {
      suspicious += 1;
    }
  }

  return suspicious / sample.length > 0.3;
};

const hasConflictMarkers = (content) =>
  /^(<<<<<<<|=======|>>>>>>>)( .*)?$/m.test(content);

const findSecretMatches = (content) => {
  const matches = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(content)) {
      matches.push(pattern.name);
    }
  }
  return matches;
};

const isAllowedBinaryPath = (filePath) => {
  const normalized = toProjectRelativePath(filePath);
  if (
    ALLOWED_BINARY_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  ) {
    return true;
  }
  return ALLOWED_BINARY_EXTENSIONS.has(path.extname(normalized).toLowerCase());
};

const parseManifestJson = (buffer, filePath, source) => {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${source} ${filePath}: ${error.message}`);
  }
};

const stableSerialize = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(",")}}`;
};

const extractDependencyFields = (manifest) => {
  const result = {};
  for (const field of DEPENDENCY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest || {}, field)) {
      result[field] = manifest[field];
    }
  }
  return result;
};

const hasDependencyFieldChangesForManifest = (filePath) => {
  const stagedBuffer = getStagedBlobBuffer(filePath);
  const headBuffer = getHeadBlobBuffer(filePath);

  const stagedManifest = parseManifestJson(stagedBuffer, filePath, "staged");
  const stagedDeps = extractDependencyFields(stagedManifest);

  if (!headBuffer) {
    return Object.keys(stagedDeps).length > 0;
  }

  const headManifest = parseManifestJson(headBuffer, filePath, "HEAD");
  const headDeps = extractDependencyFields(headManifest);

  return stableSerialize(stagedDeps) !== stableSerialize(headDeps);
};

const hasDependencyManifestChanges = (manifestPaths) =>
  manifestPaths.some((manifestPath) =>
    hasDependencyFieldChangesForManifest(manifestPath),
  );

const evaluateLockfileConsistency = (stagedFiles, options = {}) => {
  const normalized = new Set(
    stagedFiles.map((entry) => normalizeGitPath(entry)),
  );
  const projectRelativeEntries = Array.from(normalized).map((entry) =>
    toProjectRelativePath(entry),
  );
  const manifestPaths = Array.from(normalized).filter((entry) =>
    isPackageManifestPath(entry),
  );
  const hasManifestChange = manifestPaths.length > 0;
  if (!hasManifestChange) {
    return { ok: true, reason: "No package manifest changes staged." };
  }

  const hasLockfileChange = LOCKFILES.some((lockfile) =>
    projectRelativeEntries.includes(lockfile),
  );
  if (hasLockfileChange) {
    return {
      ok: true,
      reason: "Manifest and lockfile changes are both staged.",
    };
  }

  let dependencyManifestChanged;
  if (typeof options.dependencyManifestChanged === "boolean") {
    dependencyManifestChanged = options.dependencyManifestChanged;
  } else {
    try {
      dependencyManifestChanged = hasDependencyManifestChanges(manifestPaths);
    } catch (error) {
      return {
        ok: false,
        reason: `Unable to evaluate package.json dependency changes: ${error.message}`,
      };
    }
  }

  if (!dependencyManifestChanged) {
    return {
      ok: true,
      reason:
        "package.json changes do not affect dependencies; lockfile update is not required.",
    };
  }

  return {
    ok: false,
    reason:
      "A package.json change is staged without a lockfile update. Stage pnpm-lock.yaml (or equivalent lockfile).",
  };
};

const resolveRelatedUnitTests = (stagedFiles, existsFn = fs.existsSync) => {
  const results = new Set();

  for (const rawPath of stagedFiles) {
    const filePath = toProjectRelativePath(rawPath);
    if (!filePath) {
      continue;
    }

    if (/^src\/unit-tests\/.+\.test\.(ts|tsx)$/.test(filePath)) {
      if (existsInProject(filePath, existsFn)) {
        results.add(filePath);
      }
      continue;
    }

    if (!/^src\/.+\.(ts|tsx|js|jsx)$/.test(filePath)) {
      continue;
    }
    if (filePath.startsWith("src/unit-tests/")) {
      continue;
    }

    const ext = path.extname(filePath);
    const base = filePath.slice(0, -ext.length).replace(/^src\//, "");
    const candidates = [
      `src/unit-tests/${base}.test.ts`,
      `src/unit-tests/${base}.test.tsx`,
    ];

    for (const candidate of candidates) {
      if (existsInProject(candidate, existsFn)) {
        results.add(candidate);
      }
    }
  }

  return Array.from(results).sort((a, b) => a.localeCompare(b));
};

const shouldRunUnitTests = (stagedFiles) =>
  stagedFiles.some((filePath) =>
    /^src\/.+\.(ts|tsx|js|jsx)$/.test(toProjectRelativePath(filePath)),
  );

module.exports = {
  ALLOWED_BINARY_EXTENSIONS,
  ALLOWED_BINARY_PATH_PREFIXES,
  DEPENDENCY_FIELDS,
  DEFAULT_MAX_FILE_BYTES,
  LOCKFILES,
  SECRET_PATTERNS,
  evaluateLockfileConsistency,
  findSecretMatches,
  getHeadBlobBuffer,
  getStagedBlobBuffer,
  getStagedBlobSize,
  getStagedFiles,
  hasDependencyFieldChangesForManifest,
  hasDependencyManifestChanges,
  hasConflictMarkers,
  isPackageManifestPath,
  isAllowedBinaryPath,
  isBinaryContent,
  normalizeGitPath,
  parseManifestJson,
  parseGitFileList,
  resolveRelatedUnitTests,
  stableSerialize,
  shouldRunUnitTests,
};
