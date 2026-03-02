import {
  getOperationErrorMessage,
  mapCreateItemError,
  mapRenameError,
} from "../../../frontend/components/FileTreeView/errorHelpers";

const messages = {
  fileAlreadyExists: (name: string) => `File exists: ${name}`,
  folderAlreadyExists: (name: string) => `Folder exists: ${name}`,
  permissionDeniedCreateFile: "Cannot create file",
  permissionDeniedCreateFolder: "Cannot create folder",
  permissionDenied: "Permission denied",
  renameAlreadyExists: (itemType: "file" | "folder") =>
    `Rename exists: ${itemType}`,
  unknownError: "Unknown error",
};

describe("FileTreeView errorHelpers", () => {
  it("maps create-item existing and permission errors", () => {
    expect(
      mapCreateItemError(
        new Error("EEXIST"),
        "file",
        "note.md",
        "fallback",
        messages,
      ),
    ).toBe("File exists: note.md");

    expect(
      mapCreateItemError(
        new Error("permission"),
        "folder",
        "docs",
        "fallback",
        messages,
      ),
    ).toBe("Cannot create folder");
  });

  it("returns fallback message when create-item error is not an Error instance", () => {
    expect(
      mapCreateItemError({}, "file", "note.md", "fallback", messages),
    ).toBe("fallback");
  });

  it("maps rename existing and permission errors", () => {
    expect(
      mapRenameError(
        new Error("already exists"),
        "folder",
        "fallback",
        messages,
      ),
    ).toBe("Rename exists: folder");

    expect(
      mapRenameError(new Error("permission"), "file", "fallback", messages),
    ).toBe("Permission denied");
  });

  it("returns unknown operation fallback for non-error values", () => {
    expect(getOperationErrorMessage({}, "Unknown failure")).toBe(
      "Unknown failure",
    );
  });
});
