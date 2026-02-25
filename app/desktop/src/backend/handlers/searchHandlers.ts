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
        const results = await searchService.search(query, options);
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
        const results = await searchService.searchRepoWide(query, options);
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
        const result = await searchService.replaceInRepo(
          query,
          replacement,
          options,
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
