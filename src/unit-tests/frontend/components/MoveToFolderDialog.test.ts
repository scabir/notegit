import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { renderToString } from 'react-dom/server';
import { Button } from '@mui/material';
import { MoveToFolderDialog } from '../../../frontend/components/MoveToFolderDialog';
import { MOVE_DIALOG_TEXT } from '../../../frontend/components/MoveToFolderDialog/constants';
import { FileType } from '../../../shared/types';

const tree = [
  {
    id: 'folder',
    name: 'folder',
    path: 'folder',
    type: 'folder' as const,
    children: [
      {
        id: 'folder/sub',
        name: 'sub',
        path: 'folder/sub',
        type: 'folder' as const,
        children: [
          {
            id: 'folder/sub/note.md',
            name: 'note.md',
            path: 'folder/sub/note.md',
            type: 'file' as const,
            fileType: FileType.MARKDOWN,
          },
        ],
      },
    ],
  },
];

describe('MoveToFolderDialog', () => {
  it('calls onConfirm with root when confirmed', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose,
        onConfirm,
        itemToMove: {
          id: 'folder/note.md',
          name: 'note.md',
          path: 'folder/note.md',
          type: 'file',
          fileType: FileType.MARKDOWN,
        },
        tree,
      })
    );

    const buttons = renderer.root.findAllByType(Button);
    const confirmButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.confirm);

    if (!confirmButton) {
      throw new Error('Confirm button not found');
    }

    act(() => {
      confirmButton.props.onClick();
    });

    expect(onConfirm).toHaveBeenCalledWith('');
  });

  it('renders nothing when no item is provided', () => {
    const html = renderToString(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemToMove: null,
        tree,
      })
    );

    expect(html).toBe('');
  });

  it('shows empty tree message when no folders exist', () => {
    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemToMove: {
          id: 'note.md',
          name: 'note.md',
          path: 'note.md',
          type: 'file',
          fileType: FileType.MARKDOWN,
        },
        tree: [],
      })
    );

    expect(JSON.stringify(renderer.toJSON())).toContain(MOVE_DIALOG_TEXT.noFolders);
  });

  it('shows error when destination is same as current location', () => {
    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemToMove: {
          id: 'folder/note.md',
          name: 'note.md',
          path: 'folder/note.md',
          type: 'file',
          fileType: FileType.MARKDOWN,
        },
        tree,
      })
    );

    const treeView = renderer.root.findByType(require('@mui/x-tree-view').TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder');
    });

    const buttons = renderer.root.findAllByType(Button);
    const confirmButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.confirm);
    if (!confirmButton) {
      throw new Error('Confirm button not found');
    }

    act(() => {
      confirmButton.props.onClick();
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('Item is already in this location');
  });

  it('shows error when destination already has a duplicate item', () => {
    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemToMove: {
          id: 'note.md',
          name: 'note.md',
          path: 'note.md',
          type: 'file',
          fileType: FileType.MARKDOWN,
        },
        tree,
      })
    );

    const treeView = renderer.root.findByType(require('@mui/x-tree-view').TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/sub');
    });

    const buttons = renderer.root.findAllByType(Button);
    const confirmButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.confirm);
    if (!confirmButton) {
      throw new Error('Confirm button not found');
    }

    act(() => {
      confirmButton.props.onClick();
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('already exists in the destination folder');
  });

  it('prevents selecting descendant folder when moving a folder', () => {
    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemToMove: {
          id: 'folder',
          name: 'folder',
          path: 'folder',
          type: 'folder',
        },
        tree,
      })
    );

    const treeView = renderer.root.findByType(require('@mui/x-tree-view').TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder/sub');
    });

    const buttons = renderer.root.findAllByType(Button);
    const confirmButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.confirm);
    if (!confirmButton) {
      throw new Error('Confirm button not found');
    }

    act(() => {
      confirmButton.props.onClick();
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('Item is already in this location');
  });

  it('moves to a selected folder and supports cancel', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const renderer = TestRenderer.create(
      React.createElement(MoveToFolderDialog, {
        open: true,
        onClose,
        onConfirm,
        itemToMove: {
          id: 'note.md',
          name: 'note.md',
          path: 'note.md',
          type: 'file',
          fileType: FileType.MARKDOWN,
        },
        tree,
      })
    );

    const treeView = renderer.root.findByType(require('@mui/x-tree-view').TreeView);
    act(() => {
      treeView.props.onNodeSelect(null, 'folder');
    });

    const buttons = renderer.root.findAllByType(Button);
    const cancelButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.cancel);
    const confirmButton = buttons.find((button) => button.props.children === MOVE_DIALOG_TEXT.confirm);
    if (!cancelButton || !confirmButton) {
      throw new Error('Dialog buttons not found');
    }

    act(() => {
      confirmButton.props.onClick();
      cancelButton.props.onClick();
    });

    expect(onConfirm).toHaveBeenCalledWith('folder');
    expect(onClose).toHaveBeenCalled();
  });
});
