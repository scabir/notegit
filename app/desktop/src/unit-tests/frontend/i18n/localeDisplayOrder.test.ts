import { sortLocalesForDisplay } from "../../../frontend/i18n/localeDisplayOrder";

describe("sortLocalesForDisplay", () => {
  it("pins English first and orders other locales by usage rank", () => {
    const ordered = sortLocalesForDisplay([
      "tr-TR",
      "en-GB",
      "sv-SE",
      "zh-CN",
      "es-ES",
      "el-GR",
    ]);

    expect(ordered).toEqual([
      "en-GB",
      "zh-CN",
      "es-ES",
      "tr-TR",
      "el-GR",
      "sv-SE",
    ]);
  });

  it("trims and deduplicates locale inputs", () => {
    const ordered = sortLocalesForDisplay([
      " en-GB ",
      "tr-TR",
      "en-GB",
      "  ",
      "tr-TR",
      "sv-SE",
    ]);

    expect(ordered).toEqual(["en-GB", "tr-TR", "sv-SE"]);
  });

  it("returns ranked locales when English is not present", () => {
    const ordered = sortLocalesForDisplay(["sv-SE", "el-GR", "tr-TR"]);

    expect(ordered).toEqual(["tr-TR", "el-GR", "sv-SE"]);
  });

  it("places unknown locales after ranked ones and sorts them alphabetically", () => {
    const ordered = sortLocalesForDisplay([
      "en-GB",
      "xx-XX",
      "tr-TR",
      "aa-AA",
      "zz-ZZ",
    ]);

    expect(ordered).toEqual(["en-GB", "tr-TR", "aa-AA", "xx-XX", "zz-ZZ"]);
  });
});
