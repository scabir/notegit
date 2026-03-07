import {
  getRendererEntryUrl,
  isInAppNavigation,
} from "../../../electron/utils/navigationGuard";

describe("navigationGuard", () => {
  it("returns dev renderer URL in development mode", () => {
    expect(getRendererEntryUrl(true, "/app/dist/electron")).toBe(
      "http://localhost:5173",
    );
  });

  it("returns file URL in production mode", () => {
    const url = getRendererEntryUrl(false, "/app/dist/electron");
    expect(url).toBe("file:///app/frontend/index.html");
  });

  it("allows in-app dev origin navigation", () => {
    const rendererEntryUrl = "http://localhost:5173";
    expect(
      isInAppNavigation("http://localhost:5173/#/notes", rendererEntryUrl),
    ).toBe(true);
  });

  it("denies external dev navigation", () => {
    const rendererEntryUrl = "http://localhost:5173";
    expect(isInAppNavigation("https://example.com", rendererEntryUrl)).toBe(
      false,
    );
  });

  it("allows navigation to same renderer file path in production", () => {
    const rendererEntryUrl = "file:///app/frontend/index.html";
    expect(
      isInAppNavigation(
        "file:///app/frontend/index.html#section",
        rendererEntryUrl,
      ),
    ).toBe(true);
  });

  it("denies navigation to different file paths in production", () => {
    const rendererEntryUrl = "file:///app/frontend/index.html";
    expect(
      isInAppNavigation("file:///app/frontend/other.html", rendererEntryUrl),
    ).toBe(false);
  });

  it("denies malformed URLs", () => {
    const rendererEntryUrl = "http://localhost:5173";
    expect(isInAppNavigation("not-a-url", rendererEntryUrl)).toBe(false);
  });
});
