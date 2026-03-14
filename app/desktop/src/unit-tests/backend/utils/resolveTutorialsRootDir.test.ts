import { resolveTutorialsRootDir } from "../../../backend/utils/resolveTutorialsRootDir";

const TUTORIAL_SENTINELS = [
  "scenarios/create-repo-on-NoteBranch/images/step-01-welcome-screen.png",
  "scenarios/connect-s3-bucket-with-prefix/images/step-05-verify-s3-connected.png",
];

describe("resolveTutorialsRootDir", () => {
  it("prefers packaged tutorials under resourcesPath", () => {
    const availablePaths = new Set<string>(
      TUTORIAL_SENTINELS.map((entry) => `/resources/tutorials/${entry}`),
    );

    const result = resolveTutorialsRootDir({
      resourcesPath: "/resources",
      appPath: "/workspace/app/desktop",
      compiledDir: "/workspace/app/desktop/dist/backend/backend",
      exists: (targetPath) => availablePaths.has(targetPath),
    });

    expect(result).toBe("/resources/tutorials");
  });

  it("falls back to tutorials resolved from app path in development", () => {
    const availablePaths = new Set<string>(
      TUTORIAL_SENTINELS.map((entry) => `/workspace/tutorials/${entry}`),
    );

    const result = resolveTutorialsRootDir({
      resourcesPath: "/resources",
      appPath: "/workspace/app/desktop",
      compiledDir: "/workspace/app/desktop/dist/backend/backend",
      exists: (targetPath) => availablePaths.has(targetPath),
    });

    expect(result).toBe("/workspace/tutorials");
  });

  it("falls back to compiledDir-relative tutorials path", () => {
    const availablePaths = new Set<string>(
      TUTORIAL_SENTINELS.map((entry) => `/workspace/tutorials/${entry}`),
    );

    const result = resolveTutorialsRootDir({
      compiledDir: "/workspace/app/desktop/src/backend",
      exists: (targetPath) => availablePaths.has(targetPath),
    });

    expect(result).toBe("/workspace/tutorials");
  });

  it("returns null when no candidate has the required layout", () => {
    const result = resolveTutorialsRootDir({
      resourcesPath: "/resources",
      appPath: "/workspace/app/desktop",
      compiledDir: "/workspace/app/desktop/dist/backend/backend",
      exists: () => false,
    });

    expect(result).toBeNull();
  });
});
