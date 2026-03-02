import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { FileTreeDialogs } from "../../../frontend/components/FileTreeDialogs";

jest.mock("../../../frontend/components/FileTreeDialogCreateItem", () => ({
  DialogCreateItem: (props: any) =>
    React.createElement("dialog-create-item", props),
}));

jest.mock("../../../frontend/components/FileTreeDialogRename", () => ({
  DialogRename: (props: any) => React.createElement("dialog-rename", props),
}));

jest.mock("../../../frontend/components/MoveToFolderDialog", () => ({
  MoveToFolderDialog: (props: any) =>
    React.createElement("move-to-folder-dialog", props),
}));

const baseProps: React.ComponentProps<typeof FileTreeDialogs> = {
  text: {
    createFileTitle: "Create File",
    fileNameLabel: "File name",
    filePlaceholder: "file.md",
    createFolderTitle: "Create Folder",
    folderNameLabel: "Folder name",
    folderPlaceholder: "folder",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating",
    renameFolderTitle: "Rename Folder",
    renameFileTitle: "Rename File",
    newNameLabel: "New name",
    renameAction: "Rename",
    renaming: "Renaming",
  } as any,
  tree: [],
  selectedNode: {
    id: "1",
    name: "note.md",
    path: "note.md",
    type: "file",
    children: [],
  } as any,
  createFileDialogOpen: true,
  createFolderDialogOpen: true,
  renameDialogOpen: true,
  moveDialogOpen: true,
  newItemName: "draft",
  creating: false,
  errorMessage: "error",
  creationLocationText: "root",
  fileHelperText: "helper",
  onSetName: jest.fn(),
  onClearError: jest.fn(),
  onCloseCreateFileDialog: jest.fn(),
  onCloseCreateFolderDialog: jest.fn(),
  onCloseRenameDialog: jest.fn(),
  onCloseMoveDialog: jest.fn(),
  onCreateFile: jest.fn(),
  onCreateFolder: jest.fn(),
  onRename: jest.fn(),
  onMoveToFolder: jest.fn(),
};

const findByTypeName = (
  renderer: TestRenderer.ReactTestRenderer,
  typeName: string,
) =>
  renderer.root.findAll(
    (node) => typeof node.type === "string" && node.type === typeName,
  );

describe("FileTreeDialogs", () => {
  it("forwards change and close handlers while clearing errors", () => {
    const onSetName = jest.fn();
    const onClearError = jest.fn();
    const onCloseCreateFileDialog = jest.fn();
    const onCloseCreateFolderDialog = jest.fn();
    const onCloseRenameDialog = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FileTreeDialogs, {
        ...baseProps,
        onSetName,
        onClearError,
        onCloseCreateFileDialog,
        onCloseCreateFolderDialog,
        onCloseRenameDialog,
      }),
    );

    const createDialogs = findByTypeName(renderer, "dialog-create-item");
    const renameDialog = findByTypeName(renderer, "dialog-rename")[0];

    act(() => {
      createDialogs[0].props.onChange("new-file");
      createDialogs[0].props.onClose();
      createDialogs[1].props.onChange("new-folder");
      createDialogs[1].props.onClose();
      renameDialog.props.onChange("renamed.md");
      renameDialog.props.onClose();
    });

    expect(onSetName).toHaveBeenCalledWith("new-file");
    expect(onSetName).toHaveBeenCalledWith("new-folder");
    expect(onSetName).toHaveBeenCalledWith("renamed.md");
    expect(onCloseCreateFileDialog).toHaveBeenCalledTimes(1);
    expect(onCloseCreateFolderDialog).toHaveBeenCalledTimes(1);
    expect(onCloseRenameDialog).toHaveBeenCalledTimes(1);
    expect(onClearError).toHaveBeenCalledTimes(6);
  });

  it("uses folder rename title and forwards move dialog props", () => {
    const selectedNode = {
      id: "2",
      name: "docs",
      path: "docs",
      type: "folder",
      children: [],
    };

    const renderer = TestRenderer.create(
      React.createElement(FileTreeDialogs, {
        ...baseProps,
        selectedNode: selectedNode as any,
      }),
    );

    const renameDialog = findByTypeName(renderer, "dialog-rename")[0];
    const moveDialog = findByTypeName(renderer, "move-to-folder-dialog")[0];

    expect(renameDialog.props.title).toBe("Rename Folder");
    expect(renameDialog.props.placeholder).toBe("docs");
    expect(moveDialog.props.itemToMove).toEqual(selectedNode);
    expect(moveDialog.props.open).toBe(true);
  });
});
