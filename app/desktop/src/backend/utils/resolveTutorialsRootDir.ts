import * as path from "path";

const REQUIRED_TUTORIAL_SENTINELS = [
  path.join(
    "scenarios",
    "create-repo-on-NoteBranch",
    "images",
    "step-01-welcome-screen.png",
  ),
  path.join(
    "scenarios",
    "connect-s3-bucket-with-prefix",
    "images",
    "step-05-verify-s3-connected.png",
  ),
] as const;

export interface ResolveTutorialsRootDirOptions {
  explicitRoot?: string;
  resourcesPath?: string;
  appPath?: string;
  compiledDir: string;
  exists: (targetPath: string) => boolean;
}

const hasExpectedTutorialLayout = (
  candidateRoot: string,
  exists: (targetPath: string) => boolean,
): boolean => {
  return REQUIRED_TUTORIAL_SENTINELS.every((relativePath) =>
    exists(path.join(candidateRoot, relativePath)),
  );
};

const getDevelopmentCandidates = (
  options: ResolveTutorialsRootDirOptions,
): string[] => {
  const candidates: string[] = [];
  const appPath = options.appPath?.trim();

  if (appPath) {
    candidates.push(path.resolve(appPath, "../../tutorials"));
  }

  candidates.push(
    path.resolve(options.compiledDir, "../../../../../tutorials"),
  );
  candidates.push(path.resolve(options.compiledDir, "../../../../tutorials"));

  return Array.from(new Set(candidates));
};

export const resolveTutorialsRootDir = (
  options: ResolveTutorialsRootDirOptions,
): string | null => {
  const explicitRoot = options.explicitRoot?.trim();
  if (explicitRoot) {
    return explicitRoot;
  }

  const resourcesPath = options.resourcesPath?.trim();
  if (resourcesPath) {
    const packagedTutorialsRoot = path.join(resourcesPath, "tutorials");
    if (hasExpectedTutorialLayout(packagedTutorialsRoot, options.exists)) {
      return packagedTutorialsRoot;
    }
  }

  const candidates = getDevelopmentCandidates(options);
  for (const candidate of candidates) {
    if (hasExpectedTutorialLayout(candidate, options.exists)) {
      return candidate;
    }
  }

  return null;
};
