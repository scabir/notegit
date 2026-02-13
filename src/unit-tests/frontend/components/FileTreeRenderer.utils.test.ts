import React from "react";
import { renderToString } from "react-dom/server";
import { getFileIcon } from "../../../frontend/components/FileTreeRenderer/utils";
import { FileType } from "../../../shared/types";

describe("FileTreeRenderer utils", () => {
  const renderIcon = (type?: FileType) =>
    renderToString(
      React.createElement(React.Fragment, null, getFileIcon(type)),
    );

  it("returns the expected icon for each supported file type", () => {
    expect(renderIcon(FileType.MARKDOWN)).toContain("DescriptionIcon");
    expect(renderIcon(FileType.IMAGE)).toContain("ImageIcon");
    expect(renderIcon(FileType.PDF)).toContain("PictureAsPdfIcon");
    expect(renderIcon(FileType.CODE)).toContain("CodeIcon");
    expect(renderIcon(FileType.TEXT)).toContain("TextSnippetIcon");
    expect(renderIcon(FileType.JSON)).toContain("CodeIcon");
  });

  it("falls back to the generic file icon for unknown file types", () => {
    expect(renderIcon(FileType.OTHER)).toContain("InsertDriveFileIcon");
    expect(renderIcon(undefined)).toContain("InsertDriveFileIcon");
  });
});
