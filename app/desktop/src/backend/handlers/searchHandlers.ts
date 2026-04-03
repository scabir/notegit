import { IpcMain } from "electron";
import {
  SearchService,
  RepoWideSearchResult,
  ReplaceResult,
} from "../services/SearchService";
import { ApiResponse, ApiErrorCode } from "../../shared/types/api";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";
import {
  assertOptionalBoolean,
  assertOptionalInteger,
  assertOptionalPlainObject,
  assertOptionalStringArray,
  assertString,
} from "../utils/inputValidation";

const MAX_IPC_SEARCH_QUERY_LENGTH = 5000;
const MAX_IPC_SEARCH_REPLACEMENT_LENGTH = 100000;
const MAX_IPC_SEARCH_FILE_PATH_LENGTH = 4096;
const MAX_IPC_SEARCH_REPLACE_PATH_COUNT = 5000;
const MAX_IPC_SEARCH_RESULTS_LIMIT = 500;

export function registerSearchHandlers(
  ipcMain: IpcMain,
  searchService: SearchService,
  translate: BackendTranslate = createFallbackBackendTranslator(),
) {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

  ipcMain.handle(
    "search:query",
    async (
      _event,
      query: string,
      options?: { maxResults?: number },
    ): Promise<ApiResponse<any>> => {
      try {
        const validatedQuery = assertString(query, "query", {
          maxLength: MAX_IPC_SEARCH_QUERY_LENGTH,
        });
        const rawOptions = assertOptionalPlainObject(options, "options");
        const validatedMaxResults = assertOptionalInteger(
          rawOptions?.maxResults,
          "options.maxResults",
          { min: 1, max: MAX_IPC_SEARCH_RESULTS_LIMIT },
        );

        const results = await searchService.search(validatedQuery, {
          maxResults: validatedMaxResults,
        });
        return {
          ok: true,
          data: results,
        };
      } catch (error: any) {
        logger.error("Failed to execute search", { query, error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message:
                  error.message || (await t("search.errors.failedSearch")),
                details: error,
              },
        };
      }
    },
  );

  ipcMain.handle(
    "search:repoWide",
    async (
      _event,
      query: string,
      options?: { caseSensitive?: boolean; useRegex?: boolean },
    ): Promise<ApiResponse<RepoWideSearchResult[]>> => {
      try {
        const validatedQuery = assertString(query, "query", {
          maxLength: MAX_IPC_SEARCH_QUERY_LENGTH,
        });
        const rawOptions = assertOptionalPlainObject(options, "options");
        const caseSensitive = assertOptionalBoolean(
          rawOptions?.caseSensitive,
          "options.caseSensitive",
        );
        const useRegex = assertOptionalBoolean(
          rawOptions?.useRegex,
          "options.useRegex",
        );

        const results = await searchService.searchRepoWide(validatedQuery, {
          caseSensitive,
          useRegex,
        });
        return { ok: true, data: results };
      } catch (error: any) {
        logger.error("Failed to perform repo-wide search", { query, error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message:
                  error.message ||
                  (await t(
                    "search.errors.failedRepoWideSearch",
                    "Failed to perform repo-wide search",
                  )),
                details: error,
              },
        };
      }
    },
  );

  ipcMain.handle(
    "search:replaceInRepo",
    async (
      _event,
      query: string,
      replacement: string,
      options: {
        caseSensitive?: boolean;
        useRegex?: boolean;
        filePaths?: string[];
      },
    ): Promise<ApiResponse<ReplaceResult>> => {
      try {
        const validatedQuery = assertString(query, "query", {
          maxLength: MAX_IPC_SEARCH_QUERY_LENGTH,
        });
        const validatedReplacement = assertString(replacement, "replacement", {
          maxLength: MAX_IPC_SEARCH_REPLACEMENT_LENGTH,
        });
        const rawOptions = assertOptionalPlainObject(options, "options");
        const caseSensitive = assertOptionalBoolean(
          rawOptions?.caseSensitive,
          "options.caseSensitive",
        );
        const useRegex = assertOptionalBoolean(
          rawOptions?.useRegex,
          "options.useRegex",
        );
        const filePaths = assertOptionalStringArray(
          rawOptions?.filePaths,
          "options.filePaths",
          {
            maxItems: MAX_IPC_SEARCH_REPLACE_PATH_COUNT,
            itemMaxLength: MAX_IPC_SEARCH_FILE_PATH_LENGTH,
          },
        );

        const result = await searchService.replaceInRepo(
          validatedQuery,
          validatedReplacement,
          {
            caseSensitive,
            useRegex,
            filePaths,
          },
        );
        return { ok: true, data: result };
      } catch (error: any) {
        logger.error("Failed to perform repo-wide replace", {
          query,
          replacement,
          error,
        });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message:
                  error.message ||
                  (await t(
                    "search.errors.failedRepoWideReplace",
                    "Failed to perform repo-wide replace",
                  )),
                details: error,
              },
        };
      }
    },
  );
}
