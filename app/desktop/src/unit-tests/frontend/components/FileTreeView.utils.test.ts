import React from "react";
import {
  getFileIcon,
  normalizeName,
  findNode,
  findNodeByPath,
  getParentPath,
} from "../../../frontend/components/FileTreeView/utils";
import { FileType } from "../../../shared/types";

describe("FileTreeView utils", () => {
  it("returns icons for file types", () => {
    expect(React.isValidElement(getFileIcon(FileType.MARKDOWN))).toBe(true);
    expect(React.isValidElement(getFileIcon(FileType.IMAGE))).toBe(true);
    expect(React.isValidElement(getFileIcon(FileType.PDF))).toBe(true);
    expect(React.isValidElement(getFileIcon(FileType.CODE))).toBe(true);
    expect(React.isValidElement(getFileIcon(FileType.TEXT))).toBe(true);
    expect(React.isValidElement(getFileIcon(FileType.JSON))).toBe(true);
    expect(React.isValidElement(getFileIcon(undefined))).toBe(true);
  });

  it("normalizes names for s3 repos", () => {
    expect(normalizeName("My File", true)).toBe("My-File");
    expect(normalizeName("My File", false)).toBe("My File");
  });

  it("finds nodes by id or path", () => {
    const tree = [
      {
        id: "folder",
        name: "folder",
        path: "folder",
        type: "folder" as const,
        children: [
          {
            id: "folder/note.md",
            name: "note.md",
            path: "folder/note.md",
            type: "file" as const,
          },
        ],
      },
    ];

    expect(findNode(tree, "folder")?.path).toBe("folder");
    expect(findNode(tree, "folder/note.md")?.name).toBe("note.md");
    expect(findNode(tree, "missing")).toBeNull();

    expect(findNodeByPath(tree, "folder")?.id).toBe("folder");
    expect(findNodeByPath(tree, "folder/note.md")?.id).toBe("folder/note.md");
    expect(findNodeByPath(tree, "missing")).toBeNull();
  });

  it("returns parent paths", () => {
    expect(getParentPath("folder/note.md")).toBe("folder");
    expect(getParentPath("note.md")).toBe("");
  });
});
