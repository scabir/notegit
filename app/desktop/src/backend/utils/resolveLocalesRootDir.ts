import * as path from "path";

const FRONTEND_SENTINEL = path.join("frontend", "i18n", "en-GB");
const BACKEND_SENTINEL = path.join("backend", "i18n", "en-GB");

export interface ResolveLocalesRootDirOptions {
  explicitRoot?: string;
  resourcesPath?: string;
  compiledDir: string;
  exists: (targetPath: string) => boolean;
}

const hasExpectedLocaleLayout = (
  candidateRoot: string,
  exists: (targetPath: string) => boolean,
): boolean => {
  return (
    exists(path.join(candidateRoot, FRONTEND_SENTINEL)) &&
    exists(path.join(candidateRoot, BACKEND_SENTINEL))
  );
};

const getDevDefaultRoot = (compiledDir: string): string =>
  path.resolve(compiledDir, "../../../src");

export const resolveLocalesRootDir = (
  options: ResolveLocalesRootDirOptions,
): string => {
  const explicitRoot = options.explicitRoot?.trim();
  if (explicitRoot) {
    return explicitRoot;
  }

  const resourcesPath = options.resourcesPath?.trim();
  if (resourcesPath) {
    const packagedLocalesRoot = path.join(resourcesPath, "locales");
    if (hasExpectedLocaleLayout(packagedLocalesRoot, options.exists)) {
      return packagedLocalesRoot;
    }
  }

  return getDevDefaultRoot(options.compiledDir);
};
