import {
  getParentPath,
  resolveMarkdownImageSrc,
  resolveMarkdownLinkedFilePath,
} from "../../../frontend/utils/pathUtils";

describe("pathUtils", () => {
  describe("getParentPath", () => {
    it("returns parent path for nested path", () => {
      expect(getParentPath("notes/daily/today.md")).toBe("notes/daily");
    });

    it("returns empty string for root-level path", () => {
      expect(getParentPath("today.md")).toBe("");
    });
  });

  describe("resolveMarkdownImageSrc", () => {
    it("returns empty string when src is missing", () => {
      expect(resolveMarkdownImageSrc("/repo", "notes/note.md", undefined)).toBe(
        "",
      );
    });

    it("returns external src unchanged", () => {
      expect(
        resolveMarkdownImageSrc(
          "/repo",
          "notes/note.md",
          "https://example.com/a.png",
        ),
      ).toBe("https://example.com/a.png");
    });

    it("resolves relative image src from markdown file directory", () => {
      expect(
        resolveMarkdownImageSrc("/repo", "notes/note.md", "images/a.png"),
      ).toBe("file:///repo/notes/images/a.png");
    });
  });

  describe("resolveMarkdownLinkedFilePath", () => {
    it("returns null for external links and anchors", () => {
      expect(
        resolveMarkdownLinkedFilePath("notes/note.md", "https://example.com"),
      ).toBeNull();
      expect(
        resolveMarkdownLinkedFilePath("notes/note.md", "#section"),
      ).toBeNull();
      expect(
        resolveMarkdownLinkedFilePath(
          "notes/note.md",
          "mailto:test@example.com",
        ),
      ).toBeNull();
    });

    it("resolves relative links from current markdown file directory", () => {
      expect(resolveMarkdownLinkedFilePath("notes/note.md", "guide.md")).toBe(
        "notes/guide.md",
      );
      expect(
        resolveMarkdownLinkedFilePath("notes/deep/note.md", "../guide.md"),
      ).toBe("notes/guide.md");
    });

    it("resolves repo-root links", () => {
      expect(resolveMarkdownLinkedFilePath("notes/note.md", "/README.md")).toBe(
        "README.md",
      );
    });

    it("normalizes encoded and traversed paths", () => {
      expect(
        resolveMarkdownLinkedFilePath("notes/note.md", "docs/My%20Note.md"),
      ).toBe("notes/docs/My Note.md");
      expect(resolveMarkdownLinkedFilePath("note.md", "../../README.md")).toBe(
        "README.md",
      );
    });

    it("strips query/fragment from internal links", () => {
      expect(
        resolveMarkdownLinkedFilePath(
          "notes/note.md",
          "target.md?foo=1#heading",
        ),
      ).toBe("notes/target.md");
    });
  });
});
