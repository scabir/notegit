import * as fs from "fs";
import * as path from "path";

type DesktopPackageJson = {
  build?: {
    files?: unknown;
  };
};

const loadDesktopPackageJson = (): DesktopPackageJson => {
  const packageJsonPath = path.resolve(__dirname, "../../../../package.json");
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(raw) as DesktopPackageJson;
};

describe("electron-builder i18n packaging config", () => {
  it("includes frontend and backend locale directories", () => {
    const packageJson = loadDesktopPackageJson();
    const buildFiles = packageJson.build?.files;

    expect(Array.isArray(buildFiles)).toBe(true);
    expect(buildFiles).toEqual(
      expect.arrayContaining([
        "src/backend/i18n/**/*",
        "src/frontend/i18n/**/*",
      ]),
    );
  });
});
