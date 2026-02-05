import React, { forwardRef, useImperativeHandle } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useTreeContextMenu } from '../../../../../frontend/components/FileTreeView/hooks/useTreeContextMenu';
import type { FileTreeNode } from '../../../../../shared/types';

const node: FileTreeNode = {
  id: 'folder/note.md',
  name: 'note.md',
  path: 'folder/note.md',
  type: 'file',
};

type HookHandle = ReturnType<typeof useTreeContextMenu>;

type HookHarnessProps = {
  selectedNode: FileTreeNode | null;
  setSelectedNode: jest.Mock;
  onRename: jest.Mock;
  onMove: jest.Mock;
  onToggleFavorite: jest.Mock;
  onDelete: jest.Mock;
  onContextMenuOpen?: jest.Mock;
};

const HookHarness = forwardRef<HookHandle, HookHarnessProps>(
  ({ selectedNode, setSelectedNode, onRename, onMove, onToggleFavorite, onDelete, onContextMenuOpen }, ref) => {
    const treeContainerRef = React.useRef<HTMLDivElement | null>({
      focus: jest.fn(),
    } as unknown as HTMLDivElement);
    const hook = useTreeContextMenu({
      treeContainerRef,
      selectedNode,
      setSelectedNode,
      onRename,
      onMove,
      onToggleFavorite,
      onDelete,
      onContextMenuOpen,
    });
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  }
);

HookHarness.displayName = 'HookHarness';

describe('useTreeContextMenu', () => {
  it('opens a node menu and focuses the container', () => {
    const ref = React.createRef<HookHandle>();
    const setSelectedNode = jest.fn();
    const onContextMenuOpen = jest.fn();

    TestRenderer.create(
      React.createElement(HookHarness, {
        ref,
        selectedNode: null,
        setSelectedNode,
        onRename: jest.fn(),
        onMove: jest.fn(),
        onToggleFavorite: jest.fn(),
        onDelete: jest.fn(),
        onContextMenuOpen,
      })
    );

    act(() => {
      ref.current?.handleTreeContextMenu(
        {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: 10,
          clientY: 20,
        } as any,
        node
      );
    });

    expect(setSelectedNode).toHaveBeenCalledWith(node);
    expect(onContextMenuOpen).toHaveBeenCalled();
    expect(ref.current?.treeContextMenuState?.mode).toBe('node');
    expect(ref.current?.treeContextMenuState?.position).toEqual({ top: 20, left: 10 });
  });

  it('clears selection and opens the empty menu when a selection already exists', () => {
    const ref = React.createRef<HookHandle>();
    const setSelectedNode = jest.fn();

    TestRenderer.create(
      React.createElement(HookHarness, {
        ref,
        selectedNode: node,
        setSelectedNode,
        onRename: jest.fn(),
        onMove: jest.fn(),
        onToggleFavorite: jest.fn(),
        onDelete: jest.fn(),
      })
    );

    act(() => {
      ref.current?.handleTreeContextMenu(
        {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: 0,
          clientY: 0,
        } as any
      );
    });

    expect(ref.current?.treeContextMenuState).toEqual({
      node: null,
      mode: 'empty',
      position: { top: 0, left: 0 },
    });
  });

  it('opens the empty menu when nothing is selected', () => {
    const ref = React.createRef<HookHandle>();

    TestRenderer.create(
      React.createElement(HookHarness, {
        ref,
        selectedNode: null,
        setSelectedNode: jest.fn(),
        onRename: jest.fn(),
        onMove: jest.fn(),
        onToggleFavorite: jest.fn(),
        onDelete: jest.fn(),
      })
    );

    act(() => {
      ref.current?.handleTreeContextMenu(
        {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: 5,
          clientY: 6,
        } as any
      );
    });

    expect(ref.current?.treeContextMenuState?.mode).toBe('empty');
  });

  it('dispatches context menu actions', () => {
    const ref = React.createRef<HookHandle>();
    const onRename = jest.fn();
    const onMove = jest.fn();
    const onToggleFavorite = jest.fn();
    const onDelete = jest.fn();

    TestRenderer.create(
      React.createElement(HookHarness, {
        ref,
        selectedNode: null,
        setSelectedNode: jest.fn(),
        onRename,
        onMove,
        onToggleFavorite,
        onDelete,
      })
    );

    act(() => {
      ref.current?.handleTreeContextMenuAction('rename', node);
      ref.current?.handleTreeContextMenuAction('move', node);
      ref.current?.handleTreeContextMenuAction('favorite', node);
      ref.current?.handleTreeContextMenuAction('delete', node);
    });

    expect(onRename).toHaveBeenCalledWith(node);
    expect(onMove).toHaveBeenCalledWith(node);
    expect(onToggleFavorite).toHaveBeenCalledWith(node);
    expect(onDelete).toHaveBeenCalledWith(node);
  });

  it('ignores context menu actions without a node', () => {
    const ref = React.createRef<HookHandle>();
    const onRename = jest.fn();

    TestRenderer.create(
      React.createElement(HookHarness, {
        ref,
        selectedNode: null,
        setSelectedNode: jest.fn(),
        onRename,
        onMove: jest.fn(),
        onToggleFavorite: jest.fn(),
        onDelete: jest.fn(),
      })
    );

    act(() => {
      ref.current?.handleTreeContextMenuAction('rename', null);
    });

    expect(onRename).not.toHaveBeenCalled();
  });
});
