import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useFileTreeShortcuts } from '../../../../../frontend/components/FileTreeView/hooks/useFileTreeShortcuts';

const HookHarness = ({ containerRef, handlers }: any) => {
  useFileTreeShortcuts(containerRef, handlers);
  return null;
};

describe('useFileTreeShortcuts', () => {
  const setup = () => {
    const handlers = {
      openFileDialog: jest.fn(),
      openFolderDialog: jest.fn(),
      handleDelete: jest.fn(),
      handleImportFile: jest.fn(),
      handleOpenRenameDialog: jest.fn(),
      handleOpenMoveDialog: jest.fn(),
      handleToggleFavorite: jest.fn(),
    };

    const listeners: Record<string, (event: any) => void> = {};
    window.addEventListener = jest.fn((event: string, handler: any) => {
      listeners[event] = handler;
    });
    window.removeEventListener = jest.fn();
    const FakeNode = class {};
    (global as any).Node = FakeNode;
    const child = new FakeNode();
    const outside = new FakeNode();
    const container = {
      contains: (target: any) => target === child,
    };

    const containerRef = { current: container };

    act(() => {
      TestRenderer.create(
        React.createElement(HookHarness, { containerRef, handlers })
      );
    });

    return { handlers, listeners, container, child, outside };
  };

  it('ignores default prevented events', () => {
    const { handlers, listeners, child } = setup();

    listeners.keydown({
      defaultPrevented: true,
      target: child,
      key: 'a',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    expect(handlers.openFileDialog).not.toHaveBeenCalled();
  });

  it('ignores events outside the tree container', () => {
    const { handlers, listeners, outside } = setup();

    listeners.keydown({
      defaultPrevented: false,
      target: outside,
      key: 'a',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    expect(handlers.openFileDialog).not.toHaveBeenCalled();
  });

  it('handles common shortcuts', () => {
    const { handlers, listeners, child } = setup();

    listeners.keydown({
      defaultPrevented: false,
      target: child,
      key: 'A',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    listeners.keydown({
      defaultPrevented: false,
      target: child,
      key: 'F2',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    listeners.keydown({
      defaultPrevented: false,
      target: child,
      key: 'Delete',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    listeners.keydown({
      defaultPrevented: false,
      target: child,
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      preventDefault: jest.fn(),
    });

    expect(handlers.openFileDialog).toHaveBeenCalled();
    expect(handlers.handleOpenRenameDialog).toHaveBeenCalled();
    expect(handlers.handleDelete).toHaveBeenCalled();
    expect(handlers.handleToggleFavorite).toHaveBeenCalled();
  });
});
