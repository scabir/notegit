import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Button } from '@mui/material';
import { HistoryViewer } from '../../../frontend/components/HistoryViewer';
import { HISTORY_VIEWER_TEXT } from '../../../frontend/components/HistoryViewer/constants';
import { getFileName, isMarkdownFile, resolveImageSrc } from '../../../frontend/components/HistoryViewer/utils';

jest.mock('@uiw/react-codemirror', () => {
  const React = require('react');
  return (props: any) => React.createElement('div', { 'data-testid': 'codemirror', ...props });
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  return node.children ? node.children.map(flattenText).join('') : '';
};

const findButtonByText = (renderer: TestRenderer.ReactTestRenderer, text: string) => {
  return renderer.root.findAllByType(Button).find((button) => {
    const children = button.props.children;
    if (typeof children === 'string') {
      return children === text;
    }
    if (Array.isArray(children)) {
      return children.includes(text);
    }
    return false;
  });
};

describe('HistoryViewer', () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        history: {
          getVersion: jest.fn(),
        },
      },
    };
    (global as any).navigator = {
      clipboard: {
        writeText: jest.fn(),
      },
    };
  });

  it('loads content and supports copy', async () => {
    const getVersion = jest.fn().mockResolvedValue({ ok: true, data: '# Title' });
    (global as any).window.notegitApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: 'notes/note.md',
          commitHash: 'abc123',
          commitMessage: 'Update note',
          repoPath: '/repo',
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(getVersion).toHaveBeenCalledWith('abc123', 'notes/note.md');
    expect(flattenText(renderer!.toJSON())).toContain('# Title');

    const copyButton = findButtonByText(renderer!, HISTORY_VIEWER_TEXT.copyContent);
    if (!copyButton) {
      throw new Error('Copy button not found');
    }

    act(() => {
      copyButton.props.onClick();
    });

    expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith('# Title');
  });

  it('shows an error when load fails', async () => {
    const getVersion = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'Boom' },
    });
    (global as any).window.notegitApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: 'notes/note.md',
          commitHash: 'abc123',
          commitMessage: 'Update note',
          repoPath: '/repo',
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Boom');
  });

  it('shows an error when load throws', async () => {
    const getVersion = jest.fn().mockRejectedValue(new Error('Crash'));
    (global as any).window.notegitApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: 'notes/note.md',
          commitHash: 'abc123',
          commitMessage: 'Update note',
          repoPath: '/repo',
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Crash');
  });

  it('toggles between preview and source views', async () => {
    const getVersion = jest.fn().mockResolvedValue({ ok: true, data: '# Title' });
    (global as any).window.notegitApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: 'notes/note.md',
          commitHash: 'abc123',
          commitMessage: 'Update note',
          repoPath: '/repo',
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const sourceButton = findButtonByText(renderer!, HISTORY_VIEWER_TEXT.source);
    const previewButton = findButtonByText(renderer!, HISTORY_VIEWER_TEXT.preview);
    if (!sourceButton || !previewButton) {
      throw new Error('View toggle buttons not found');
    }

    act(() => {
      sourceButton.props.onClick();
    });

    expect(renderer!.root.findAllByProps({ 'data-testid': 'codemirror' }).length).toBe(1);

    act(() => {
      previewButton.props.onClick();
    });

    expect(renderer!.root.findAllByProps({ 'data-testid': 'codemirror' }).length).toBe(0);
  });
});

describe('HistoryViewer utils', () => {
  it('derives file name and markdown detection', () => {
    expect(getFileName('notes/note.md')).toBe('note.md');
    expect(getFileName(null)).toBe('');
    expect(isMarkdownFile('notes/note.md')).toBe(true);
    expect(isMarkdownFile('notes/note.txt')).toBe(false);
  });

  it('resolves image sources', () => {
    expect(resolveImageSrc('/repo', 'images/a.png')).toBe('file:///repo/images/a.png');
    expect(resolveImageSrc('/repo', 'http://example.com/img.png')).toBe('http://example.com/img.png');
    expect(resolveImageSrc(null, 'images/a.png')).toBe('images/a.png');
  });
});
