import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { FsAdapter } from "../../../backend/adapters/FsAdapter";
import { TranslationService } from "../../../backend/services/TranslationService";

const writeTranslationFile = async (
  rootDir: string,
  domain: "frontend" | "backend",
  locale: string,
  fileName: string,
  content: string,
): Promise<void> => {
  const localeDir = path.join(rootDir, domain, "i18n", locale);
  await fs.mkdir(localeDir, { recursive: true });
  await fs.writeFile(path.join(localeDir, fileName), content, "utf-8");
};

describe("TranslationService", () => {
  let tmpRootDir: string;
  let translationService: TranslationService;

  beforeEach(async () => {
    tmpRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "notegit-i18n-"));
    translationService = new TranslationService(new FsAdapter(), {
      localesRootDir: tmpRootDir,
      fallbackLocale: "en-GB",
    });
  });

  afterEach(async () => {
    await fs.rm(tmpRootDir, { recursive: true, force: true });
  });

  it("returns fallback bundle for fallback locale", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "en-GB",
      "SettingsDialog.json",
      JSON.stringify({
        title: "Settings",
        close: "Close",
      }),
    );

    const bundle = await translationService.getBundle("frontend", "en-GB");

    expect(bundle.requestedLocale).toBe("en-GB");
    expect(bundle.locale).toBe("en-GB");
    expect(bundle.fallbackLocale).toBe("en-GB");
    expect(bundle.namespaces).toEqual(["SettingsDialog"]);
    expect(bundle.translations).toEqual({
      SettingsDialog: {
        title: "Settings",
        close: "Close",
      },
    });
    expect(bundle.validation.isValid).toBe(true);
  });

  it("merges requested locale over fallback locale", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "en-GB",
      "SettingsDialog.json",
      JSON.stringify({
        title: "Settings",
        close: "Close",
      }),
    );
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "de-DE",
      "SettingsDialog.json",
      JSON.stringify({
        title: "Einstellungen",
      }),
    );

    const bundle = await translationService.getBundle("frontend", "de-DE");

    expect(bundle.requestedLocale).toBe("de-DE");
    expect(bundle.locale).toBe("de-DE");
    expect(bundle.translations).toEqual({
      SettingsDialog: {
        title: "Einstellungen",
        close: "Close",
      },
    });
    expect(bundle.validation).toMatchObject({
      isValid: false,
      missingKeys: ["SettingsDialog.close"],
      extraKeys: [],
    });
  });

  it("falls back entirely when requested locale has no files", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "en-GB",
      "RepoSetupDialog.json",
      JSON.stringify({
        title: "Connect to Repository",
      }),
    );

    const bundle = await translationService.getBundle("frontend", "fr-FR");

    expect(bundle.requestedLocale).toBe("fr-FR");
    expect(bundle.locale).toBe("en-GB");
    expect(bundle.translations).toEqual({
      RepoSetupDialog: {
        title: "Connect to Repository",
      },
    });
    expect(bundle.validation.isValid).toBe(true);
  });

  it("detects extra keys and type mismatches in requested locale", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "en-GB",
      "SettingsDialog.json",
      JSON.stringify({
        section: {
          title: "Settings",
        },
      }),
    );
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "tr-TR",
      "SettingsDialog.json",
      JSON.stringify({
        section: "Ayarlar",
        extra: "Ekstra",
      }),
    );

    const bundle = await translationService.getBundle("frontend", "tr-TR");

    expect(bundle.validation.isValid).toBe(false);
    expect(bundle.validation.missingKeys).toEqual([
      "SettingsDialog.section.title",
    ]);
    expect(bundle.validation.extraKeys).toEqual([
      "SettingsDialog.extra",
      "SettingsDialog.section",
    ]);
    expect(bundle.validation.typeMismatches).toEqual([
      {
        key: "SettingsDialog.section",
        expected: "object",
        actual: "leaf",
      },
    ]);
  });

  it("supports YAML translation files", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "backend",
      "en-GB",
      "errors.yaml",
      "repo_not_found: Repository not found\npermission_denied: Permission denied\n",
    );
    await writeTranslationFile(
      tmpRootDir,
      "backend",
      "de-DE",
      "errors.yml",
      "repo_not_found: Repository nicht gefunden\n",
    );

    const bundle = await translationService.getBundle("backend", "de-DE");

    expect(bundle.locale).toBe("de-DE");
    expect(bundle.translations).toEqual({
      errors: {
        repo_not_found: "Repository nicht gefunden",
        permission_denied: "Permission denied",
      },
    });
  });

  it("throws when fallback locale is missing", async () => {
    await expect(
      translationService.getBundle("frontend", "de-DE"),
    ).rejects.toThrow('Fallback locale "en-GB" has no translation files');
  });

  it("throws on invalid locale code", async () => {
    await writeTranslationFile(
      tmpRootDir,
      "frontend",
      "en-GB",
      "SettingsDialog.json",
      JSON.stringify({ title: "Settings" }),
    );

    await expect(
      translationService.getBundle("frontend", "../de-DE"),
    ).rejects.toThrow("Invalid locale code");
  });
});
