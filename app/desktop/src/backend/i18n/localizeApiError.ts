import { ApiError, ApiErrorCode } from "../../shared/types";
import { BackendTranslate } from "./backendTranslator";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeMessage = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0
    ? value
    : "Unknown error";

const resolveMessageKey = (details: unknown): string | null => {
  if (!isRecord(details)) {
    return null;
  }

  return typeof details.messageKey === "string" ? details.messageKey : null;
};

const resolveMessageParams = (
  details: unknown,
): Record<string, string | number | boolean> | undefined => {
  if (!isRecord(details) || !isRecord(details.messageParams)) {
    return undefined;
  }

  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details.messageParams)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      params[key] = value;
    }
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

interface InferredLocalization {
  key: string;
  params?: Record<string, string | number | boolean>;
}

type InferredMatcher = {
  pattern: RegExp;
  build: (groups: Record<string, string>) => InferredLocalization;
};

const asGroups = (
  input: Record<string, string> | undefined,
): Record<string, string> => input || {};

const inferredMatchers: InferredMatcher[] = [
  {
    pattern: /^File not found: (?<path>.+)$/u,
    build: ({ path }) => ({ key: "fs.errors.fileNotFound", params: { path } }),
  },
  {
    pattern: /^Directory not found: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.directoryNotFound",
      params: { path },
    }),
  },
  {
    pattern: /^Path not found: (?<path>.+)$/u,
    build: ({ path }) => ({ key: "fs.errors.pathNotFound", params: { path } }),
  },
  {
    pattern: /^Source file not found: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.sourceFileNotFound",
      params: { path },
    }),
  },
  {
    pattern: /^Permission denied: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.permissionDeniedPath",
      params: { path },
    }),
  },
  {
    pattern: /^Permission denied$/u,
    build: () => ({ key: "fs.errors.permissionDenied" }),
  },
  {
    pattern: /^Failed to read file: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedReadFile",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to write file: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedWriteFile",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to delete file: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedDeleteFile",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to rename from (?<from>.+) to (?<to>.+)$/u,
    build: ({ from, to }) => ({
      key: "fs.errors.failedRename",
      params: { from, to },
    }),
  },
  {
    pattern: /^Failed to create directory: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedCreateDirectory",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to delete directory: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedDeleteDirectory",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to read directory: (?<path>.+)$/u,
    build: ({ path }) => ({
      key: "fs.errors.failedReadDirectory",
      params: { path },
    }),
  },
  {
    pattern: /^Failed to stat: (?<path>.+)$/u,
    build: ({ path }) => ({ key: "fs.errors.failedStat", params: { path } }),
  },
  {
    pattern: /^Failed to copy file from (?<from>.+) to (?<to>.+)$/u,
    build: ({ from, to }) => ({
      key: "fs.errors.failedCopyFile",
      params: { from, to },
    }),
  },
  {
    pattern: /^Authentication failed\. Please check your credentials\.$/u,
    build: () => ({ key: "git.errors.authenticationFailed" }),
  },
  {
    pattern: /^Authentication failed during pull$/u,
    build: () => ({ key: "git.errors.authenticationFailedPull" }),
  },
  {
    pattern: /^Authentication failed during push$/u,
    build: () => ({ key: "git.errors.authenticationFailedPush" }),
  },
  {
    pattern: /^Merge conflict detected\. Please resolve conflicts manually\.$/u,
    build: () => ({ key: "git.errors.mergeConflictDetected" }),
  },
  {
    pattern: /^Failed to clone repository: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedCloneRepository",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to get git status: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedGetStatus",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to pull: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedPull",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to push: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedPush",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to add file: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedAddFile",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to commit: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedCommit",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to add remote: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedAddRemote",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to get git log: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedGetLog",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to show file: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedShowFile",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to get diff: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "git.errors.failedGetDiff",
      params: { message },
    }),
  },
  {
    pattern:
      /^(GitAdapter|Git adapter) not initialized(\. Call init\(\) first\.)?$/u,
    build: () => ({ key: "git.errors.notInitialized" }),
  },
  {
    pattern: /^Failed to get bucket versioning: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedGetBucketVersioning",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to list objects: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedListObjects",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to list object versions: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedListObjectVersions",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to get object: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedGetObject",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to upload object: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedUploadObject",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to read object metadata: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedReadObjectMetadata",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to delete object: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "s3.errors.failedDeleteObject",
      params: { message },
    }),
  },
  {
    pattern: /^S3 adapter is not configured$/u,
    build: () => ({ key: "s3.errors.notConfigured" }),
  },
  {
    pattern: /^S3 bucket is not configured$/u,
    build: () => ({ key: "s3.errors.bucketNotConfigured" }),
  },
  {
    pattern: /^No repository configured$/u,
    build: () => ({ key: "repo.errors.noRepositoryConfigured" }),
  },
  {
    pattern: /^Repository settings not found$/u,
    build: () => ({ key: "repo.errors.repositorySettingsNotFound" }),
  },
  {
    pattern:
      /^Local path is required for (?<provider>Git|S3|local) repository$/u,
    build: ({ provider }) => ({
      key: "repo.errors.localPathRequiredForProvider",
      params: { provider },
    }),
  },
  {
    pattern: /^Local path must be a directory$/u,
    build: () => ({ key: "repo.errors.localPathMustBeDirectory" }),
  },
  {
    pattern: /^S3 bucket versioning must be enabled to use history$/u,
    build: () => ({ key: "repo.errors.s3VersioningRequired" }),
  },
  {
    pattern:
      /^(?<provider>Git|S3|Local)RepoProvider configured with non-[a-z]+ settings$/u,
    build: ({ provider }) => ({
      key: "repo.errors.providerMisconfigured",
      params: { provider },
    }),
  },
  {
    pattern:
      /^(?<provider>Git|S3|Local)RepoProvider cannot open non-[a-z]+ repository$/u,
    build: ({ provider }) => ({
      key: "repo.errors.providerTypeMismatch",
      params: { provider },
    }),
  },
  {
    pattern: /^Unsupported repository provider: (?<provider>.+)$/u,
    build: ({ provider }) => ({
      key: "repo.errors.unsupportedProvider",
      params: { provider },
    }),
  },
  {
    pattern: /^Unsupported history provider: (?<provider>.+)$/u,
    build: ({ provider }) => ({
      key: "history.errors.unsupportedProvider",
      params: { provider },
    }),
  },
  {
    pattern: /^Repository not initialized$/u,
    build: () => ({ key: "search.errors.repositoryNotInitialized" }),
  },
  {
    pattern: /^Search failed$/u,
    build: () => ({ key: "search.errors.searchFailed" }),
  },
  {
    pattern: /^Repo-wide search failed: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "search.errors.repoWideSearchFailedTemplate",
      params: { message },
    }),
  },
  {
    pattern: /^Repo-wide replace failed: (?<message>.+)$/u,
    build: ({ message }) => ({
      key: "search.errors.repoWideReplaceFailedTemplate",
      params: { message },
    }),
  },
  {
    pattern: /^Failed to read (?<logType>combined|error) log: (?<message>.+)$/u,
    build: ({ logType, message }) => ({
      key: "logs.errors.failedReadLogTemplate",
      params: { logType, message },
    }),
  },
  {
    pattern: /^Log file not found: (?<logType>combined|error)$/u,
    build: ({ logType }) => ({
      key: "logs.errors.logFileNotFound",
      params: { logType },
    }),
  },
  {
    pattern:
      /^Failed to export (?<logType>combined|error) log: (?<message>.+)$/u,
    build: ({ logType, message }) => ({
      key: "logs.errors.failedExportLogTemplate",
      params: { logType, message },
    }),
  },
  {
    pattern:
      /^Local repositories do not support (?<operation>fetch|pull|push)$/u,
    build: ({ operation }) => ({
      key: "repo.errors.localRepoOperationNotSupported",
      params: { operation },
    }),
  },
  {
    pattern: /^History is not available for local repositories$/u,
    build: () => ({ key: "history.errors.localHistoryUnavailable" }),
  },
  {
    pattern: /^Diff is not supported for S3 history$/u,
    build: () => ({ key: "history.errors.s3DiffNotSupported" }),
  },
  {
    pattern: /^S3 history provider is not configured$/u,
    build: () => ({ key: "history.errors.s3HistoryNotConfigured" }),
  },
  {
    pattern:
      /^(?<provider>Git|S3|Local)HistoryProvider configured with non-[a-z]+ settings$/u,
    build: ({ provider }) => ({
      key: "history.errors.providerMisconfigured",
      params: { provider },
    }),
  },
];

const inferLocalization = (message: string): InferredLocalization | null => {
  for (const matcher of inferredMatchers) {
    const match = message.match(matcher.pattern);
    if (!match) {
      continue;
    }
    return matcher.build(asGroups(match.groups));
  }
  return null;
};

export const localizeApiError = async (
  error: any,
  translate: BackendTranslate,
): Promise<ApiError> => {
  const code = error?.code || ApiErrorCode.UNKNOWN_ERROR;
  const fallbackMessage = normalizeMessage(error?.message);
  let messageKey = resolveMessageKey(error?.details);
  let messageParams = resolveMessageParams(error?.details);

  if (!messageKey) {
    const inferred = inferLocalization(fallbackMessage);
    if (inferred) {
      messageKey = inferred.key;
      messageParams = inferred.params;
    }
  }

  const message = messageKey
    ? await translate(messageKey, {
        fallback: fallbackMessage,
        params: messageParams,
      })
    : fallbackMessage;

  return {
    code,
    message,
    details: error?.details,
  };
};
