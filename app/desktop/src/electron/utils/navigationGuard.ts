import { pathToFileURL } from "url";
import * as path from "path";

const DEV_RENDERER_URL = "http://localhost:5173";

const safeParseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const getRendererEntryUrl = (
  isDevelopment: boolean,
  dirname: string,
): string => {
  if (isDevelopment) {
    return DEV_RENDERER_URL;
  }
  const filePath = path.join(dirname, "../../frontend/index.html");
  return pathToFileURL(filePath).toString();
};

export const isInAppNavigation = (
  targetUrl: string,
  rendererEntryUrl: string,
): boolean => {
  const target = safeParseUrl(targetUrl);
  const renderer = safeParseUrl(rendererEntryUrl);

  if (!target || !renderer) {
    return false;
  }

  if (renderer.protocol === "file:") {
    return target.protocol === "file:" && target.pathname === renderer.pathname;
  }

  return target.origin === renderer.origin;
};
