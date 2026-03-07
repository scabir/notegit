import { getDefaultTranslation } from "../../i18n/defaultTranslations";

type TranslateFn = (key: string) => string;

export const FILE_TREE_CONTEXT_MENUS_IDS = {
  favoriteMenu: "favorite-context-menu",
  favoriteRemove: "favorite-context-menu-remove",
  treeEmptyMenu: "tree-context-menu-empty",
  treeNodeMenu: "tree-context-menu",
} as const;

export const FILE_TREE_CONTEXT_MENUS_KEYS = {
  favoriteActionsAria: "fileTreeContextMenus.favoriteActionsAria",
  treeBackgroundActionsAria: "fileTreeContextMenus.treeBackgroundActionsAria",
  treeItemActionsAria: "fileTreeContextMenus.treeItemActionsAria",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const buildFileTreeContextMenusText = (t: TranslateFn) => ({
  favoriteActionsAria: t(FILE_TREE_CONTEXT_MENUS_KEYS.favoriteActionsAria),
  treeBackgroundActionsAria: t(
    FILE_TREE_CONTEXT_MENUS_KEYS.treeBackgroundActionsAria,
  ),
  treeItemActionsAria: t(FILE_TREE_CONTEXT_MENUS_KEYS.treeItemActionsAria),
});

export const FILE_TREE_CONTEXT_MENUS_TEXT = {
  favoriteActionsAria: defaultText(
    FILE_TREE_CONTEXT_MENUS_KEYS.favoriteActionsAria,
  ),
  treeBackgroundActionsAria: defaultText(
    FILE_TREE_CONTEXT_MENUS_KEYS.treeBackgroundActionsAria,
  ),
  treeItemActionsAria: defaultText(
    FILE_TREE_CONTEXT_MENUS_KEYS.treeItemActionsAria,
  ),
} as const;
