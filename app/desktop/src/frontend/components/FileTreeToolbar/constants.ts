import enGbFileTreeView from "../../i18n/en-GB/fileTreeView.json";

export const TOOLBAR_KEYS = {
  collapseTree: "fileTreeView.toolbar.collapseTree",
  expandTree: "fileTreeView.toolbar.expandTree",
  back: "fileTreeView.toolbar.back",
  forward: "fileTreeView.toolbar.forward",
  newFile: "fileTreeView.toolbar.newFile",
  newFolder: "fileTreeView.toolbar.newFolder",
  importFile: "fileTreeView.toolbar.importFile",
  collapseAll: "fileTreeView.toolbar.collapseAll",
} as const;

export const TOOLBAR_TEXT = {
  collapseTree: enGbFileTreeView.toolbar.collapseTree,
  expandTree: enGbFileTreeView.toolbar.expandTree,
  back: enGbFileTreeView.toolbar.back,
  forward: enGbFileTreeView.toolbar.forward,
  newFile: enGbFileTreeView.toolbar.newFile,
  newFolder: enGbFileTreeView.toolbar.newFolder,
  importFile: enGbFileTreeView.toolbar.importFile,
  collapseAll: enGbFileTreeView.toolbar.collapseAll,
} as const;
