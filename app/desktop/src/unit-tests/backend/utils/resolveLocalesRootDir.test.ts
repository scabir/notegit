import * as path from "path";
import { resolveLocalesRootDir } from "../../../backend/utils/resolveLocalesRootDir";

const createExistsStub = (existingPaths: string[]) => {
  const normalized = new Set(
    existingPaths.map((entry) => path.normalize(entry)),
  );
  return (targetPath: string): boolean =>
    normalized.has(path.normalize(targetPath));
};

describe("resolveLocalesRootDir", () => {
  it("uses explicit root when provided", () => {
    const result = resolveLocalesRootDir({
      explicitRoot: " /tmp/custom-locales ",
      resourcesPath: "/resources",
      compiledDir: "/repo/app/desktop/dist/electron/backend",
      exists: createExistsStub([]),
    });

    expect(result).toBe("/tmp/custom-locales");
  });

  it("prefers packaged resources locales when layout exists", () => {
    const packagedRoot = "/resources/locales";
    const result = resolveLocalesRootDir({
      resourcesPath: "/resources",
      compiledDir: "/repo/app/desktop/dist/electron/backend",
      exists: createExistsStub([
        path.join(packagedRoot, "frontend", "i18n", "en-GB"),
        path.join(packagedRoot, "backend", "i18n", "en-GB"),
      ]),
    });

    expect(result).toBe(packagedRoot);
  });

  it("falls back to src root when packaged layout is missing", () => {
    const compiledDir = "/repo/app/desktop/dist/electron/backend";
    const result = resolveLocalesRootDir({
      resourcesPath: "/resources",
      compiledDir,
      exists: createExistsStub([]),
    });

    expect(result).toBe("/repo/app/desktop/src");
  });
});
