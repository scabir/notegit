import { ApiErrorCode } from "../../../shared/types";
import { localizeApiError } from "../../../backend/i18n/localizeApiError";

describe("localizeApiError", () => {
  it("uses explicit message key and params from error details", async () => {
    const translate = jest.fn(async (_key: string, options?: any) => {
      return `translated:${options?.params?.path}`;
    });

    const result = await localizeApiError(
      {
        code: ApiErrorCode.FS_NOT_FOUND,
        message: "File not found: /tmp/note.md",
        details: {
          messageKey: "fs.errors.fileNotFound",
          messageParams: {
            path: "/tmp/note.md",
            retries: 3,
            hidden: false,
          },
        },
      },
      translate,
    );

    expect(result).toEqual({
      code: ApiErrorCode.FS_NOT_FOUND,
      message: "translated:/tmp/note.md",
      details: {
        messageKey: "fs.errors.fileNotFound",
        messageParams: {
          path: "/tmp/note.md",
          retries: 3,
          hidden: false,
        },
      },
    });
    expect(translate).toHaveBeenCalledWith("fs.errors.fileNotFound", {
      fallback: "File not found: /tmp/note.md",
      params: {
        path: "/tmp/note.md",
        retries: 3,
        hidden: false,
      },
    });
  });

  it("filters unsupported message param value types before translating", async () => {
    const translate = jest.fn(async () => "translated");

    await localizeApiError(
      {
        message: "Whatever",
        details: {
          messageKey: "files.errors.any",
          messageParams: {
            path: "/tmp",
            retryCount: 2,
            enabled: true,
            nested: { a: 1 },
            list: [1, 2, 3],
            nil: null,
          },
        },
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("files.errors.any", {
      fallback: "Whatever",
      params: {
        path: "/tmp",
        retryCount: 2,
        enabled: true,
      },
    });
  });

  it("omits params when messageParams contains no supported primitive values", async () => {
    const translate = jest.fn(async () => "translated");

    await localizeApiError(
      {
        message: "Whatever",
        details: {
          messageKey: "files.errors.any",
          messageParams: {
            nested: { a: 1 },
            list: [1, 2, 3],
            nil: null,
          },
        },
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("files.errors.any", {
      fallback: "Whatever",
      params: undefined,
    });
  });

  it("infers file-not-found localization from fallback message when details do not contain messageKey", async () => {
    const translate = jest.fn(async () => "localized file not found");

    const result = await localizeApiError(
      {
        code: ApiErrorCode.FS_NOT_FOUND,
        message: "File not found: /repo/missing.md",
        details: {},
      },
      translate,
    );

    expect(result.code).toBe(ApiErrorCode.FS_NOT_FOUND);
    expect(result.message).toBe("localized file not found");
    expect(translate).toHaveBeenCalledWith("fs.errors.fileNotFound", {
      fallback: "File not found: /repo/missing.md",
      params: { path: "/repo/missing.md" },
    });
  });

  it("infers rename localization and maps both from/to params", async () => {
    const translate = jest.fn(async () => "localized rename error");

    await localizeApiError(
      {
        message: "Failed to rename from /a.md to /b.md",
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("fs.errors.failedRename", {
      fallback: "Failed to rename from /a.md to /b.md",
      params: { from: "/a.md", to: "/b.md" },
    });
  });

  it("infers git not initialized key for both naming variants", async () => {
    const translate = jest.fn(async () => "localized git init error");

    await localizeApiError(
      {
        message: "Git adapter not initialized",
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("git.errors.notInitialized", {
      fallback: "Git adapter not initialized",
      params: undefined,
    });
  });

  it("covers all inferred localization matchers", async () => {
    const cases: Array<{
      message: string;
      key: string;
      params?: Record<string, string | number | boolean>;
    }> = [
      {
        message: "File not found: /tmp/file.md",
        key: "fs.errors.fileNotFound",
        params: { path: "/tmp/file.md" },
      },
      {
        message: "Directory not found: /tmp/folder",
        key: "fs.errors.directoryNotFound",
        params: { path: "/tmp/folder" },
      },
      {
        message: "Path not found: /tmp/any",
        key: "fs.errors.pathNotFound",
        params: { path: "/tmp/any" },
      },
      {
        message: "Source file not found: /tmp/source.md",
        key: "fs.errors.sourceFileNotFound",
        params: { path: "/tmp/source.md" },
      },
      {
        message: "Permission denied: /tmp/secret",
        key: "fs.errors.permissionDeniedPath",
        params: { path: "/tmp/secret" },
      },
      { message: "Permission denied", key: "fs.errors.permissionDenied" },
      {
        message: "Failed to read file: /tmp/read.md",
        key: "fs.errors.failedReadFile",
        params: { path: "/tmp/read.md" },
      },
      {
        message: "Failed to write file: /tmp/write.md",
        key: "fs.errors.failedWriteFile",
        params: { path: "/tmp/write.md" },
      },
      {
        message: "Failed to delete file: /tmp/delete.md",
        key: "fs.errors.failedDeleteFile",
        params: { path: "/tmp/delete.md" },
      },
      {
        message: "Failed to rename from /tmp/a.md to /tmp/b.md",
        key: "fs.errors.failedRename",
        params: { from: "/tmp/a.md", to: "/tmp/b.md" },
      },
      {
        message: "Failed to create directory: /tmp/new-dir",
        key: "fs.errors.failedCreateDirectory",
        params: { path: "/tmp/new-dir" },
      },
      {
        message: "Failed to delete directory: /tmp/old-dir",
        key: "fs.errors.failedDeleteDirectory",
        params: { path: "/tmp/old-dir" },
      },
      {
        message: "Failed to read directory: /tmp/read-dir",
        key: "fs.errors.failedReadDirectory",
        params: { path: "/tmp/read-dir" },
      },
      {
        message: "Failed to stat: /tmp/stat-target",
        key: "fs.errors.failedStat",
        params: { path: "/tmp/stat-target" },
      },
      {
        message: "Failed to copy file from /tmp/a.md to /tmp/b.md",
        key: "fs.errors.failedCopyFile",
        params: { from: "/tmp/a.md", to: "/tmp/b.md" },
      },
      {
        message: "Authentication failed. Please check your credentials.",
        key: "git.errors.authenticationFailed",
      },
      {
        message: "Authentication failed during pull",
        key: "git.errors.authenticationFailedPull",
      },
      {
        message: "Authentication failed during push",
        key: "git.errors.authenticationFailedPush",
      },
      {
        message: "Merge conflict detected. Please resolve conflicts manually.",
        key: "git.errors.mergeConflictDetected",
      },
      {
        message: "Failed to clone repository: boom",
        key: "git.errors.failedCloneRepository",
        params: { message: "boom" },
      },
      {
        message: "Failed to get git status: boom",
        key: "git.errors.failedGetStatus",
        params: { message: "boom" },
      },
      {
        message: "Failed to pull: boom",
        key: "git.errors.failedPull",
        params: { message: "boom" },
      },
      {
        message: "Failed to push: boom",
        key: "git.errors.failedPush",
        params: { message: "boom" },
      },
      {
        message: "Failed to add file: boom",
        key: "git.errors.failedAddFile",
        params: { message: "boom" },
      },
      {
        message: "Failed to commit: boom",
        key: "git.errors.failedCommit",
        params: { message: "boom" },
      },
      {
        message: "Failed to add remote: boom",
        key: "git.errors.failedAddRemote",
        params: { message: "boom" },
      },
      {
        message: "Failed to get git log: boom",
        key: "git.errors.failedGetLog",
        params: { message: "boom" },
      },
      {
        message: "Failed to show file: boom",
        key: "git.errors.failedShowFile",
        params: { message: "boom" },
      },
      {
        message: "Failed to get diff: boom",
        key: "git.errors.failedGetDiff",
        params: { message: "boom" },
      },
      {
        message: "GitAdapter not initialized. Call init() first.",
        key: "git.errors.notInitialized",
      },
      {
        message: "Failed to get bucket versioning: boom",
        key: "s3.errors.failedGetBucketVersioning",
        params: { message: "boom" },
      },
      {
        message: "Failed to list objects: boom",
        key: "s3.errors.failedListObjects",
        params: { message: "boom" },
      },
      {
        message: "Failed to list object versions: boom",
        key: "s3.errors.failedListObjectVersions",
        params: { message: "boom" },
      },
      {
        message: "Failed to get object: boom",
        key: "s3.errors.failedGetObject",
        params: { message: "boom" },
      },
      {
        message: "Failed to upload object: boom",
        key: "s3.errors.failedUploadObject",
        params: { message: "boom" },
      },
      {
        message: "Failed to read object metadata: boom",
        key: "s3.errors.failedReadObjectMetadata",
        params: { message: "boom" },
      },
      {
        message: "Failed to delete object: boom",
        key: "s3.errors.failedDeleteObject",
        params: { message: "boom" },
      },
      {
        message: "S3 adapter is not configured",
        key: "s3.errors.notConfigured",
      },
      {
        message: "S3 bucket is not configured",
        key: "s3.errors.bucketNotConfigured",
      },
      {
        message: "No repository configured",
        key: "repo.errors.noRepositoryConfigured",
      },
      {
        message: "Repository settings not found",
        key: "repo.errors.repositorySettingsNotFound",
      },
      {
        message: "Local path is required for Git repository",
        key: "repo.errors.localPathRequiredForProvider",
        params: { provider: "Git" },
      },
      {
        message: "Local path must be a directory",
        key: "repo.errors.localPathMustBeDirectory",
      },
      {
        message: "S3 bucket versioning must be enabled to use history",
        key: "repo.errors.s3VersioningRequired",
      },
      {
        message: "LocalRepoProvider configured with non-local settings",
        key: "repo.errors.providerMisconfigured",
        params: { provider: "Local" },
      },
      {
        message: "S3RepoProvider cannot open non-git repository",
        key: "repo.errors.providerTypeMismatch",
        params: { provider: "S3" },
      },
      {
        message: "Unsupported repository provider: ftp",
        key: "repo.errors.unsupportedProvider",
        params: { provider: "ftp" },
      },
      {
        message: "Unsupported history provider: ftp",
        key: "history.errors.unsupportedProvider",
        params: { provider: "ftp" },
      },
      {
        message: "Repository not initialized",
        key: "search.errors.repositoryNotInitialized",
      },
      {
        message: "Search failed",
        key: "search.errors.searchFailed",
      },
      {
        message: "Repo-wide search failed: boom",
        key: "search.errors.repoWideSearchFailedTemplate",
        params: { message: "boom" },
      },
      {
        message: "Repo-wide replace failed: boom",
        key: "search.errors.repoWideReplaceFailedTemplate",
        params: { message: "boom" },
      },
      {
        message: "Failed to read combined log: denied",
        key: "logs.errors.failedReadLogTemplate",
        params: { logType: "combined", message: "denied" },
      },
      {
        message: "Log file not found: error",
        key: "logs.errors.logFileNotFound",
        params: { logType: "error" },
      },
      {
        message: "Failed to export error log: denied",
        key: "logs.errors.failedExportLogTemplate",
        params: { logType: "error", message: "denied" },
      },
      {
        message: "Local repositories do not support fetch",
        key: "repo.errors.localRepoOperationNotSupported",
        params: { operation: "fetch" },
      },
      {
        message: "History is not available for local repositories",
        key: "history.errors.localHistoryUnavailable",
      },
      {
        message: "Diff is not supported for S3 history",
        key: "history.errors.s3DiffNotSupported",
      },
      {
        message: "S3 history provider is not configured",
        key: "history.errors.s3HistoryNotConfigured",
      },
      {
        message: "GitHistoryProvider configured with non-git settings",
        key: "history.errors.providerMisconfigured",
        params: { provider: "Git" },
      },
    ];

    for (const testCase of cases) {
      const translate = jest.fn(async () => `translated:${testCase.key}`);
      const result = await localizeApiError(
        { message: testCase.message },
        translate,
      );

      expect(result.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe(`translated:${testCase.key}`);
      expect(translate).toHaveBeenCalledWith(testCase.key, {
        fallback: testCase.message,
        params: testCase.params,
      });
    }
  });

  it("infers provider mismatch message params from provider-prefixed errors", async () => {
    const translate = jest.fn(async () => "localized provider mismatch");

    await localizeApiError(
      {
        message: "LocalRepoProvider configured with non-local settings",
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith(
      "repo.errors.providerMisconfigured",
      {
        fallback: "LocalRepoProvider configured with non-local settings",
        params: { provider: "Local" },
      },
    );
  });

  it("falls back to plain message when no key can be inferred", async () => {
    const translate = jest.fn(async () => "unused");

    const result = await localizeApiError(
      {
        code: ApiErrorCode.UNKNOWN_ERROR,
        message: "Completely custom message",
        details: { arbitrary: true },
      },
      translate,
    );

    expect(result).toEqual({
      code: ApiErrorCode.UNKNOWN_ERROR,
      message: "Completely custom message",
      details: { arbitrary: true },
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it("uses Unknown error and UNKNOWN_ERROR code when input error is null", async () => {
    const translate = jest.fn(async () => "unused");

    const result = await localizeApiError(null, translate);

    expect(result).toEqual({
      code: ApiErrorCode.UNKNOWN_ERROR,
      message: "Unknown error",
      details: undefined,
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it("uses Unknown error fallback when message is blank", async () => {
    const translate = jest.fn(async () => "localized");

    await localizeApiError(
      {
        details: {
          messageKey: "common.errors.unknown",
        },
        message: "   ",
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("common.errors.unknown", {
      fallback: "Unknown error",
      params: undefined,
    });
  });

  it("prefers explicit messageKey over inferred key when both are possible", async () => {
    const translate = jest.fn(async () => "explicit");

    await localizeApiError(
      {
        message: "File not found: /tmp/x.md",
        details: {
          messageKey: "custom.errors.override",
          messageParams: {
            key: "value",
          },
        },
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith("custom.errors.override", {
      fallback: "File not found: /tmp/x.md",
      params: {
        key: "value",
      },
    });
  });
});
