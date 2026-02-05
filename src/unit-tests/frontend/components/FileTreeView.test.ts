jest.mock('@mui/material/Menu', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
  };
});

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Tooltip, IconButton, Button, TextField } from '@mui/material';
import { TreeView } from '@mui/x-tree-view';
import { FileTreeView } from '../../../frontend/components/FileTreeView';
import { FILE_TREE_TEXT } from '../../../frontend/components/FileTreeView/constants';
import { MoveToFolderDialog } from '../../../frontend/components/MoveToFolderDialog';
import { FileType } from '../../../shared/types';

const tree = [
  {
    id: 'folder',
    name: 'folder',
    path: 'folder',
    type: 'folder' as const,
    children: [
      {
        id: 'folder/note.md',
        name: 'note.md',
        path: 'folder/note.md',
        type: 'file' as const,
        fileType: FileType.MARKDOWN,
      },
    ],
  },
];

const getTooltipButton = (renderer: TestRenderer.ReactTestRenderer, title: string) => {
  const tooltip = renderer.root
    .findAllByType(Tooltip)
    .find((item) => item.props.title === title);

  if (!tooltip) {
    throw new Error(`Tooltip not found: ${title}`);
  }

  return tooltip.findByType(IconButton);
};

const flattenText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  return node.children ? node.children.map(flattenText).join('') : '';
};

const createLocalStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

let treeKeyHandlers: Record<string, any> = {};

const fireShortcut = (event: Partial<KeyboardEvent>) => {
  const handler = treeKeyHandlers.keydown;
  if (!handler) {
    throw new Error('Keyboard handler not registered');
  }
  act(() => {
    handler({
      key: event.key || '',
      ctrlKey: event.ctrlKey || false,
      metaKey: event.metaKey || false,
      shiftKey: event.shiftKey || false,
      preventDefault: event.preventDefault || jest.fn(),
      target: event.target || null,
    });
  });
};

describe('FileTreeView toolbar actions', () => {
  const renderers: TestRenderer.ReactTestRenderer[] = [];
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    treeKeyHandlers = {};
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global as any).window = {
      localStorage: createLocalStorageMock(),
      notegitApi: {
        config: {
          getFavorites: jest.fn().mockResolvedValue({ ok: true, data: [] }),
          updateFavorites: jest.fn().mockResolvedValue({ ok: true }),
        },
        dialog: {
          showOpenDialog: jest.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
        },
      },
      confirm: jest.fn(),
      alert: jest.fn(),
      addEventListener: jest.fn((event: string, handler: any) => {
        treeKeyHandlers[event] = handler;
      }),
      removeEventListener: jest.fn(),
    };
    (global as any).alert = (global as any).window.alert;
  });

  afterEach(async () => {
    await act(async () => {
      await flushPromises();
    });
    renderers.splice(0).forEach((renderer) => renderer.unmount());
    consoleErrorSpy.mockRestore();
  });

  const createTreeRenderer = (overrides: Record<string, any> = {}) => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(FileTreeView, {
          tree,
          selectedFile: null,
          onSelectFile: jest.fn(),
          onCreateFile: jest.fn(),
          onCreateFolder: jest.fn(),
          onDelete: jest.fn(),
          onRename: jest.fn(),
          onDuplicate: jest.fn(),
          onImport: jest.fn(),
          isS3Repo: false,
          ...overrides,
        })
      );
    });
    renderers.push(renderer!);
    return renderer!;
  };

  const openTreeContextMenu = (renderer: TestRenderer.ReactTestRenderer, nodeId: string) => {
    const label = renderer.root.find(
      (node) => node.props && node.props['data-node-id'] === nodeId
    );

    if (!label) {
      throw new Error(`Tree item label not found: ${nodeId}`);
    }

    act(() => {
      label.props.onContextMenu({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: {} as HTMLElement,
      });
    });
  };

  const selectTreeNode = (renderer: TestRenderer.ReactTestRenderer, nodeId: string) => {
    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, nodeId);
    });
  };

  const openRenameDialogFromContextMenu = (renderer: TestRenderer.ReactTestRenderer, nodeId: string) => {
    openTreeContextMenu(renderer, nodeId);
    const renameMenuItem = renderer.root.find(
      (node) => node.props && node.props['data-testid'] === 'tree-context-rename'
    );
    act(() => renameMenuItem.props.onClick());
  };

  const openMoveDialogFromContextMenu = (renderer: TestRenderer.ReactTestRenderer, nodeId: string) => {
    openTreeContextMenu(renderer, nodeId);
    const moveMenuItem = renderer.root.find(
      (node) => node.props && node.props['data-testid'] === 'tree-context-move'
    );
    act(() => moveMenuItem.props.onClick());
  };

  const triggerDeleteFromContextMenu = async (
    renderer: TestRenderer.ReactTestRenderer,
    nodeId: string
  ) => {
    selectTreeNode(renderer, nodeId);
    openTreeContextMenu(renderer, nodeId);
    const deleteMenuItem = renderer.root.find(
      (node) => node.props && node.props['data-testid'] === 'tree-context-delete'
    );
    await act(async () => {
      deleteMenuItem.props.onClick();
    });
  };

  const triggerFavoriteFromContextMenu = (renderer: TestRenderer.ReactTestRenderer, nodeId: string) => {
    openTreeContextMenu(renderer, nodeId);
    const favoriteMenuItem = renderer.root.find(
      (node) => node.props && node.props['data-testid'] === 'tree-context-favorite'
    );
    act(() => favoriteMenuItem.props.onClick());
  };

  const openTreeContainerContextMenu = (renderer: TestRenderer.ReactTestRenderer) => {
    const container = renderer.root.find(
      (node) => node.props && typeof node.props.className === 'string' && node.props.className.includes('tree-container')
    );

    if (!container) {
      throw new Error('Tree container not found');
    }

    act(() => {
      container.props.onContextMenu({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: {} as HTMLElement,
      });
    });
  };

  describe('keyboard shortcuts', () => {

    it('opens the create file dialog with Ctrl+A', () => {
      const renderer = createTreeRenderer();
      const preventDefault = jest.fn();
      fireShortcut({ key: 'a', ctrlKey: true, preventDefault });

      const fileDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'create-file-dialog'
      );
      expect(fileDialog.props.open).toBe(true);
      expect(preventDefault).toHaveBeenCalled();
    });

    it('opens the create folder dialog with Ctrl+D', () => {
      const renderer = createTreeRenderer();
      const preventDefault = jest.fn();
      fireShortcut({ key: 'd', ctrlKey: true, preventDefault });

      const folderDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'create-folder-dialog'
      );
      expect(folderDialog.props.open).toBe(true);
      expect(preventDefault).toHaveBeenCalled();
    });

    it('triggers delete with the Delete key', async () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      const renderer = createTreeRenderer({ onDelete });
      const treeView = renderer.root.findByType(TreeView);
      act(() => {
        treeView.props.onNodeSelect(null, 'folder/note.md');
      });

      (global as any).window.confirm = jest.fn().mockReturnValue(true);
      const preventDefault = jest.fn();
      fireShortcut({ key: 'Delete', preventDefault });

      expect(onDelete).toHaveBeenCalledWith('folder/note.md');
      expect(preventDefault).toHaveBeenCalled();
    });

    it('opens the import dialog with Ctrl+I', () => {
      createTreeRenderer();
      const preventDefault = jest.fn();
      fireShortcut({ key: 'i', ctrlKey: true, preventDefault });

      expect((global as any).window.notegitApi.dialog.showOpenDialog).toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    });

    it('opens the rename dialog with Ctrl+R and F2', () => {
      const renderer = createTreeRenderer();
      const treeView = renderer.root.findByType(TreeView);
      act(() => {
        treeView.props.onNodeSelect(null, 'folder/note.md');
      });

      const preventDefault = jest.fn();
      fireShortcut({ key: 'r', ctrlKey: true, preventDefault });

      let renameDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'rename-dialog'
      );
      expect(renameDialog.props.open).toBe(true);
      expect(preventDefault).toHaveBeenCalled();

      act(() => {
        renameDialog.props.onClose();
      });

      const preventDefaultF2 = jest.fn();
      fireShortcut({ key: 'F2', preventDefault: preventDefaultF2 });
      renameDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'rename-dialog'
      );
      expect(renameDialog.props.open).toBe(true);
      expect(preventDefaultF2).toHaveBeenCalled();
    });

    it('opens the move dialog with Ctrl+M', () => {
      const renderer = createTreeRenderer();
      const treeView = renderer.root.findByType(TreeView);
      act(() => {
        treeView.props.onNodeSelect(null, 'folder/note.md');
      });

      const preventDefault = jest.fn();
      fireShortcut({ key: 'm', ctrlKey: true, preventDefault });

      const moveDialog = renderer.root.findByType(MoveToFolderDialog);
      expect(moveDialog.props.open).toBe(true);
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('favorites list', () => {
    it('adds the selection to favorites via the context menu and exposes the list', () => {
      const onSelectFile = jest.fn();
      const renderer = createTreeRenderer({ onSelectFile });
      triggerFavoriteFromContextMenu(renderer, 'folder/note.md');

      const favoritesSection = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'favorites-section'
      );
      expect(favoritesSection).toBeDefined();

      const favoriteItem = renderer.root
        .findAllByType(Button)
        .find((button) => flattenText(button) === 'note.md');
      expect(favoriteItem).toBeDefined();

      act(() => favoriteItem?.props.onClick());
      expect(onSelectFile).toHaveBeenCalledWith('folder/note.md', 'file');

      const treeViewAfter = renderer.root.findByType(TreeView);
      expect(treeViewAfter.props.selected).toBe('folder/note.md');
    });

    it('opens the editor when a favorite file is clicked', () => {
      const onSelectFile = jest.fn();
      const renderer = createTreeRenderer({ onSelectFile });
      triggerFavoriteFromContextMenu(renderer, 'folder/note.md');

      const favoriteItem = renderer.root
        .findAllByType(Button)
        .find((button) => flattenText(button) === 'note.md');
      expect(favoriteItem).toBeDefined();

      act(() => favoriteItem?.props.onClick());
      expect(onSelectFile).toHaveBeenCalledWith('folder/note.md', 'file');
    });

    it('selects the tree node when a favorite file is clicked', () => {
      const renderer = createTreeRenderer();
      triggerFavoriteFromContextMenu(renderer, 'folder/note.md');

      const favoriteItem = renderer.root
        .findAllByType(Button)
        .find((button) => flattenText(button) === 'note.md');
      expect(favoriteItem).toBeDefined();

      act(() => favoriteItem?.props.onClick());

      const treeViewAfter = renderer.root.findByType(TreeView);
      expect(treeViewAfter.props.selected).toBe('folder/note.md');
    });

    it('expands a favorited folder when selected from favorites', () => {
      const renderer = createTreeRenderer();
      triggerFavoriteFromContextMenu(renderer, 'folder');

      const favoriteItem = renderer.root
        .findAllByType(Button)
        .find((button) => flattenText(button) === 'folder');
      expect(favoriteItem).toBeDefined();

      act(() => favoriteItem?.props.onClick());

      const treeViewAfter = renderer.root.findByType(TreeView);
      expect(treeViewAfter.props.expanded).toContain('folder');
    });

    it('toggles favorites using the configured keyboard shortcut', () => {
      const renderer = createTreeRenderer();
      const treeView = renderer.root.findByType(TreeView);
      act(() => {
        treeView.props.onNodeSelect(null, 'folder/note.md');
      });

      const preventDefault = jest.fn();
      fireShortcut({ key: 's', ctrlKey: true, shiftKey: true, preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      const favoritesSection = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'favorites-section'
      );
      expect(favoritesSection).toBeDefined();
    });

    it('removes a favorite via the context menu', () => {
      const renderer = createTreeRenderer();
      triggerFavoriteFromContextMenu(renderer, 'folder/note.md');

      const favoriteItem = renderer.root
        .findAllByType(Button)
        .find((button) => flattenText(button) === 'note.md');
      expect(favoriteItem).toBeDefined();

      act(() => {
        favoriteItem?.props.onContextMenu({
          preventDefault: jest.fn(),
          currentTarget: {} as HTMLElement,
        });
      });

      const menuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'favorite-context-menu-remove'
      );
      act(() => menuItem.props.onClick());

      const favoritesSection = renderer.root.findAll(
        (node) => node.props && node.props['data-testid'] === 'favorites-section'
      );
      expect(favoritesSection.length).toBe(0);
    });
  });

  describe('tree context menu', () => {
    it('opens rename from context menu', () => {
      const renderer = createTreeRenderer();
      openTreeContextMenu(renderer, 'folder/note.md');

      const renameMenuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-rename'
      );
      act(() => renameMenuItem.props.onClick());

      const renameDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'rename-dialog'
      );

      expect(renameDialog.props.open).toBe(true);
    });

    it('deletes nodes via context menu', async () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      const renderer = createTreeRenderer({ onDelete });
      openTreeContextMenu(renderer, 'folder/note.md');

      (global as any).window.confirm = jest.fn().mockReturnValue(true);
      const deleteMenuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-delete'
      );

      await act(async () => deleteMenuItem.props.onClick());

      expect(onDelete).toHaveBeenCalledWith('folder/note.md');
    });

    it('duplicates file via context menu', async () => {
      const onDuplicate = jest.fn().mockResolvedValue('folder/note(1).md');
      const renderer = createTreeRenderer({ onDuplicate });
      openTreeContextMenu(renderer, 'folder/note.md');

      const duplicateMenuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-duplicate'
      );

      await act(async () => duplicateMenuItem.props.onClick());

      expect(onDuplicate).toHaveBeenCalledWith('folder/note.md');
    });
  });

  describe('tree background context menu', () => {
    it('offers create options when no selection exists', () => {
      const renderer = createTreeRenderer();
      openTreeContainerContextMenu(renderer);

      const menuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-new-file'
      );
      expect(menuItem).toBeDefined();
    });

    it('opens create file dialog from the context menu', () => {
      const renderer = createTreeRenderer();
      openTreeContainerContextMenu(renderer);

      const menuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-new-file'
      );
      act(() => menuItem.props.onClick());

      const fileDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'create-file-dialog'
      );
      expect(fileDialog.props.open).toBe(true);
    });

    it('opens create folder dialog from the context menu', () => {
      const renderer = createTreeRenderer();
      openTreeContainerContextMenu(renderer);

      const menuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-new-folder'
      );
      act(() => menuItem.props.onClick());

      const folderDialog = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'create-folder-dialog'
      );
      expect(folderDialog.props.open).toBe(true);
    });

    it('invokes import when selecting Import from the context menu', () => {
      const renderer = createTreeRenderer();
      openTreeContainerContextMenu(renderer);

      const menuItem = renderer.root.find(
        (node) => node.props && node.props['data-testid'] === 'tree-context-import'
      );
      act(() => menuItem.props.onClick());

      expect((global as any).window.notegitApi.dialog.showOpenDialog).toHaveBeenCalled();
    });
  });

  it('invokes back and forward actions from the toolbar', () => {
    const onNavigateBack = jest.fn();
    const onNavigateForward = jest.fn();
    const renderer = createTreeRenderer({
      onNavigateBack,
      onNavigateForward,
      canNavigateBack: true,
      canNavigateForward: true,
    });

    const backButton = getTooltipButton(renderer, 'Back');
    const forwardButton = getTooltipButton(renderer, 'Forward');

    act(() => {
      backButton.props.onClick();
      forwardButton.props.onClick();
    });

    expect(onNavigateBack).toHaveBeenCalled();
    expect(onNavigateForward).toHaveBeenCalled();
  });

  it('opens move dialog from context menu for selected node', () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );
    openMoveDialogFromContextMenu(renderer, 'folder/note.md');

    const dialog = renderer.root.findByType(MoveToFolderDialog);
    expect(dialog.props.open).toBe(true);
  });

  it('creates an S3-safe markdown file name when creating a file', async () => {
    const onCreateFile = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile,
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: true,
      })
    );

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);

    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'My Note' } });
    });

    const buttons = renderer.root.findAllByType(Button);
    const createAction = buttons.find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createAction) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createAction.props.onClick();
    });

    expect(onCreateFile).toHaveBeenCalledWith('', 'My-Note.md');
  });

  it('shows validation error for invalid folder names', async () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn().mockResolvedValue(undefined),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const newFolderButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFolder);
    act(() => {
      newFolderButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.folderNameLabel);

    if (!textField) {
      throw new Error('Folder name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'bad*name' } });
    });

    const buttons = renderer.root.findAllByType(Button);
    const createAction = buttons.find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createAction) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createAction.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Folder name contains invalid characters');
  });

  it('does not delete when confirmation is rejected', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(false);
    const onDelete = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete,
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });
    await triggerDeleteFromContextMenu(renderer, 'folder/note.md');

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('imports a file into the selected folder', async () => {
    const onImport = jest.fn().mockResolvedValue(undefined);
    (global as any).window.notegitApi.dialog.showOpenDialog = jest.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/import.md'],
    });

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport,
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder');
    });

    const importButton = getTooltipButton(renderer, FILE_TREE_TEXT.importFile);
    await act(async () => {
      importButton.props.onClick();
    });

    expect(onImport).toHaveBeenCalledWith('/tmp/import.md', 'folder/import.md');
  });

  it('renames a selected file', async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );
    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'renamed.md' } });
    });

    const buttons = renderer.root.findAllByType(Button);
    const renameAction = buttons.find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(onRename).toHaveBeenCalledWith('folder/note.md', 'folder/renamed.md');
  });

  it('moves a file via the move dialog', async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );
    openMoveDialogFromContextMenu(renderer, 'folder/note.md');

    const dialog = renderer.root.findByType(MoveToFolderDialog);
    await act(async () => {
      await dialog.props.onConfirm('folder');
    });

    expect(onRename).toHaveBeenCalledWith('folder/note.md', 'folder/note.md');
  });

  it('selects and clears a file selection', () => {
    const onSelectFile = jest.fn();
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile,
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    expect(onSelectFile).toHaveBeenCalledWith('folder/note.md', 'file');

    const container = renderer.root.findAll(
      (node) => node.props.className === 'tree-container'
    )[0];

    act(() => {
      container.props.onClick({
        target: {
          classList: { contains: (value: string) => value === 'tree-container' },
          closest: () => null,
        },
      });
    });
  });

  it('creates a file inside the selected folder', async () => {
    const onCreateFile = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile,
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder');
    });

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);

    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'New Note' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(onCreateFile).toHaveBeenCalledWith('folder', 'New Note.md');
  });

  it('creates a file using the selected file parent path', async () => {
    const onCreateFile = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile,
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);
    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'child' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(onCreateFile).toHaveBeenCalledWith('folder', 'child.md');
    const treeViewAfter = renderer.root.findByType(TreeView);
    expect(treeViewAfter.props.expanded).toContain('folder');
  });

  it('shows permission error when creating a file is denied', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onCreateFile = jest.fn().mockRejectedValue(new Error('EACCES'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile,
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);
    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'note' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Permission denied to create file');
    consoleSpy.mockRestore();
  });

  it('creates a folder inside the selected folder', async () => {
    const onCreateFolder = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder,
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder');
    });

    const newFolderButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFolder);
    act(() => {
      newFolderButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.folderNameLabel);
    if (!textField) {
      throw new Error('Folder name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'nested' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(onCreateFolder).toHaveBeenCalledWith('folder', 'nested');
  });

  it('shows permission error when creating a folder is denied', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onCreateFolder = jest.fn().mockRejectedValue(new Error('permission'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder,
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const newFolderButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFolder);
    act(() => {
      newFolderButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.folderNameLabel);
    if (!textField) {
      throw new Error('Folder name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'docs' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Permission denied to create folder');
    consoleSpy.mockRestore();
  });

  it('shows validation error for invalid file names', async () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);

    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'bad*name' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('File name contains invalid characters');
  });

  it('shows an error when creating a duplicate file', async () => {
    const onCreateFile = jest.fn().mockRejectedValue(new Error('exists'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile,
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.fileNameLabel);

    if (!textField) {
      throw new Error('File name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'note' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(onCreateFile).toHaveBeenCalled();
    expect(flattenText(renderer.toJSON())).toContain('already exists');
  });

  it('creates a folder using the selected file parent', async () => {
    const onCreateFolder = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder,
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    const newFolderButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFolder);
    act(() => {
      newFolderButton.props.onClick();
    });

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.folderNameLabel);

    if (!textField) {
      throw new Error('Folder name input not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'docs' } });
    });

    const createButton = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.create);
    if (!createButton) {
      throw new Error('Create button not found');
    }

    await act(async () => {
      createButton.props.onClick();
    });

    expect(onCreateFolder).toHaveBeenCalledWith('folder', 'docs');
  });

  it('shows error when rename is empty', async () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: '   ' } });
    });

    const renameAction = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Name cannot be empty');
  });

  it('shows validation error for invalid rename characters', async () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'bad*name' } });
    });

    const renameAction = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Name contains invalid characters');
  });

  it('shows rename error when target already exists', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onRename = jest.fn().mockRejectedValue(new Error('already exists'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'duplicate.md' } });
    });

    const renameAction = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('already exists');
    consoleSpy.mockRestore();
  });

  it('shows rename error when permission is denied', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onRename = jest.fn().mockRejectedValue(new Error('permission denied'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'new.md' } });
    });

    const renameAction = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Permission denied');
    consoleSpy.mockRestore();
  });

  it('deletes selected node when confirmed', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(true);
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete,
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    await triggerDeleteFromContextMenu(renderer, 'folder/note.md');

    expect(onDelete).toHaveBeenCalledWith('folder/note.md');
  });

  it('expands folders when selectedFile is nested', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(FileTreeView, {
          tree,
          selectedFile: 'folder/note.md',
          onSelectFile: jest.fn(),
          onCreateFile: jest.fn(),
          onCreateFolder: jest.fn(),
          onDelete: jest.fn(),
          onRename: jest.fn(),
          onImport: jest.fn(),
          isS3Repo: false,
        })
      );
    });

    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });

    const treeView = renderer!.root.findByType(TreeView);
    expect(treeView.props.expanded).toContain('folder');
  });

  it('does not rename when name is unchanged', async () => {
    const onRename = jest.fn();
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openRenameDialogFromContextMenu(renderer, 'folder/note.md');

    const textField = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.label === FILE_TREE_TEXT.newNameLabel);
    if (!textField) {
      throw new Error('Rename field not found');
    }

    act(() => {
      textField.props.onChange({ target: { value: 'note.md' } });
    });

    const renameAction = renderer.root
      .findAllByType(Button)
      .find((button: any) => button.props?.children === FILE_TREE_TEXT.renameAction);
    if (!renameAction) {
      throw new Error('Rename action not found');
    }

    await act(async () => {
      renameAction.props.onClick();
    });

    expect(onRename).not.toHaveBeenCalled();
  });

  it('alerts when delete fails', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(true);
    (global as any).window.alert = jest.fn();
    (global as any).alert = (global as any).window.alert;
    const onDelete = jest.fn().mockRejectedValue(new Error('delete failed'));
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete,
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    await triggerDeleteFromContextMenu(renderer, 'folder/note.md');

    expect((global as any).window.alert).toHaveBeenCalled();
  });

  it('alerts when dialog api is missing for import', async () => {
    (global as any).window.notegitApi.dialog = undefined;
    (global as any).window.alert = jest.fn();
    (global as any).alert = (global as any).window.alert;
    const onImport = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport,
        isS3Repo: false,
      })
    );

    const importButton = getTooltipButton(renderer, FILE_TREE_TEXT.importFile);
    await act(async () => {
      importButton.props.onClick();
    });

    expect((global as any).window.alert).toHaveBeenCalledWith(
      'Dialog API not available. Please restart the app.'
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  it('does not import when file selection is canceled', async () => {
    (global as any).window.notegitApi.dialog.showOpenDialog = jest.fn().mockResolvedValue({
      canceled: true,
      filePaths: [],
    });
    const onImport = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport,
        isS3Repo: false,
      })
    );

    const importButton = getTooltipButton(renderer, FILE_TREE_TEXT.importFile);
    await act(async () => {
      importButton.props.onClick();
    });

    expect(onImport).not.toHaveBeenCalled();
  });

  it('imports into the parent folder when a file is selected', async () => {
    const onImport = jest.fn().mockResolvedValue(undefined);
    (global as any).window.notegitApi.dialog.showOpenDialog = jest.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/another.md'],
    });

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport,
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    const importButton = getTooltipButton(renderer, FILE_TREE_TEXT.importFile);
    await act(async () => {
      importButton.props.onClick();
    });

    expect(onImport).toHaveBeenCalledWith('/tmp/another.md', 'folder/another.md');
  });

  it('alerts when import fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global as any).window.alert = jest.fn();
    (global as any).alert = (global as any).window.alert;
    (global as any).window.notegitApi.dialog.showOpenDialog = jest.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/bad.md'],
    });
    const onImport = jest.fn().mockRejectedValue(new Error('boom'));

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport,
        isS3Repo: false,
      })
    );

    const importButton = getTooltipButton(renderer, FILE_TREE_TEXT.importFile);
    await act(async () => {
      importButton.props.onClick();
    });

    expect((global as any).window.alert).toHaveBeenCalledWith('Failed to import file: boom');
    consoleSpy.mockRestore();
  });

  it('alerts when move fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global as any).window.alert = jest.fn();
    (global as any).alert = (global as any).window.alert;
    const onRename = jest.fn().mockRejectedValue(new Error('move failed'));

    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename,
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    openMoveDialogFromContextMenu(renderer, 'folder/note.md');

    const dialog = renderer.root.findByType(MoveToFolderDialog);
    await act(async () => {
      await dialog.props.onConfirm('dest');
    });

    expect((global as any).window.alert).toHaveBeenCalledWith('Failed to move: move failed');
    consoleSpy.mockRestore();
  });

  it('clears selection when clicking the container background', () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    const container = renderer.root.findAll(
      (node) => node.props.className === 'tree-container'
    )[0];
    if (!container) {
      throw new Error('Tree container not found');
    }

    act(() => {
      container.props.onClick({
        target: {
          classList: { contains: (value: string) => value === 'tree-container' },
          closest: () => null,
        },
      });
    });

  });

  it('shows creation location for selected file parent', () => {
    const renderer = TestRenderer.create(
      React.createElement(FileTreeView, {
        tree,
        selectedFile: null,
        onSelectFile: jest.fn(),
        onCreateFile: jest.fn(),
        onCreateFolder: jest.fn(),
        onDelete: jest.fn(),
        onRename: jest.fn(),
        onImport: jest.fn(),
        isS3Repo: false,
      })
    );

    const treeView = renderer.root.findByType(TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/note.md');
    });

    const newFileButton = getTooltipButton(renderer, FILE_TREE_TEXT.newFile);
    act(() => {
      newFileButton.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain('Will be created in: folder');
  });
});
