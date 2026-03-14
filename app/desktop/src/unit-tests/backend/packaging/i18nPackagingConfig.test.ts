import * as fs from "fs";
import * as path from "path";

type DesktopPackageJson = {
  build?: {
    files?: unknown;
    extraResources?: unknown;
  };
};

const loadDesktopPackageJson = (): DesktopPackageJson => {
  const packageJsonPath = path.resolve(__dirname, "../../../../package.json");
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(raw) as DesktopPackageJson;
};

describe("electron-builder packaging config", () => {
  it("includes locale directories and tutorial assets", () => {
    const packageJson = loadDesktopPackageJson();
    const buildFiles = packageJson.build?.files;
    const extraResources = packageJson.build?.extraResources;

    expect(Array.isArray(buildFiles)).toBe(true);
    expect(buildFiles).toEqual(
      expect.arrayContaining([
        "src/backend/i18n/**/*",
        "src/frontend/i18n/**/*",
      ]),
    );

    expect(Array.isArray(extraResources)).toBe(true);
    expect(extraResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "src/frontend/i18n",
          to: "locales/frontend/i18n",
        }),
        expect.objectContaining({
          from: "src/backend/i18n",
          to: "locales/backend/i18n",
        }),
        expect.objectContaining({
          from: "../../tutorials",
          to: "tutorials",
          filter: ["scenarios/**/*"],
        }),
      ]),
    );
  });
});
