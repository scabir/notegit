import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Button, TextField, ListItemButton } from '@mui/material';
import { RepoSearchDialog } from '../../../frontend/components/RepoSearchDialog';
import { REPO_SEARCH_TEXT } from '../../../frontend/components/RepoSearchDialog/constants';
import type { RepoWideSearchResult } from '../../../shared/types';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

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

describe('RepoSearchDialog', () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        search: {
          repoWide: jest.fn(),
          replaceInRepo: jest.fn(),
        },
      },
      confirm: jest.fn(),
    };
  });

  it('shows validation error when query is empty', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectMatch: jest.fn(),
        })
      );
    });

    const searchButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.searchButton);
    if (!searchButton) {
      throw new Error('Search button not found');
    }

    await act(async () => {
      searchButton.props.onClick();
      await flushPromises();
    });

    const text = renderer!.toJSON();
    const flatten = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(flatten).join('');
      return node.children ? node.children.map(flatten).join('') : '';
    };
    expect(flatten(text)).toContain(REPO_SEARCH_TEXT.emptyQueryError);
  });

  it('searches and opens selected match', async () => {
    const result: RepoWideSearchResult = {
      filePath: 'notes/note.md',
      fileName: 'note.md',
      fullPath: '/repo/notes/note.md',
      matches: [
        {
          lineNumber: 4,
          lineContent: 'hello world',
          matchStart: 0,
          matchEnd: 5,
          contextBefore: '',
          contextAfter: '',
        },
      ],
    };
    const repoWide = jest.fn().mockResolvedValue({ ok: true, data: [result] });
    (global as any).window.notegitApi.search.repoWide = repoWide;

    const onSelectMatch = jest.fn();
    const onClose = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSearchDialog, {
          open: true,
          onClose,
          onSelectMatch,
        })
      );
    });

    const queryField = renderer!.root
      .findAllByType(TextField)
      .find((field) => field.props.label === REPO_SEARCH_TEXT.findLabel);

    if (!queryField) {
      throw new Error('Query field not found');
    }

    act(() => {
      queryField.props.onChange({ target: { value: 'hello' } });
    });

    const searchButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.searchButton);
    if (!searchButton) {
      throw new Error('Search button not found');
    }

    await act(async () => {
      searchButton.props.onClick();
      await flushPromises();
    });

    expect(repoWide).toHaveBeenCalledWith('hello', { caseSensitive: false, useRegex: false });

    const matchButtons = renderer!.root.findAllByType(ListItemButton);
    expect(matchButtons.length).toBeGreaterThan(0);

    act(() => {
      matchButtons[0].props.onClick();
    });

    expect(onSelectMatch).toHaveBeenCalledWith('notes/note.md', 4);
    expect(onClose).toHaveBeenCalled();
  });

  it('replaces matches within a file and refreshes results', async () => {
    const result: RepoWideSearchResult = {
      filePath: 'notes/note.md',
      fileName: 'note.md',
      fullPath: '/repo/notes/note.md',
      matches: [
        {
          lineNumber: 4,
          lineContent: 'hello world',
          matchStart: 0,
          matchEnd: 5,
          contextBefore: '',
          contextAfter: '',
        },
      ],
    };

    const repoWide = jest.fn().mockResolvedValue({ ok: true, data: [result] });
    const replaceInRepo = jest.fn().mockResolvedValue({
      ok: true,
      data: { totalReplacements: 1, filesProcessed: 1, filesModified: 1, errors: [] },
    });
    (global as any).window.notegitApi.search.repoWide = repoWide;
    (global as any).window.notegitApi.search.replaceInRepo = replaceInRepo;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectMatch: jest.fn(),
        })
      );
    });

    const fields = renderer!.root.findAllByType(TextField);
    const queryField = fields.find((field) => field.props.label === REPO_SEARCH_TEXT.findLabel);
    const replaceField = fields.find((field) => field.props.label === REPO_SEARCH_TEXT.replaceLabel);
    if (!queryField || !replaceField) {
      throw new Error('Query or replace field not found');
    }

    act(() => {
      queryField.props.onChange({ target: { value: 'hello' } });
      replaceField.props.onChange({ target: { value: 'hi' } });
    });

    const searchButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.searchButton);
    if (!searchButton) {
      throw new Error('Search button not found');
    }

    await act(async () => {
      searchButton.props.onClick();
      await flushPromises();
    });

    const replaceInFileButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.replaceInFile);
    if (!replaceInFileButton) {
      throw new Error('Replace in file button not found');
    }

    await act(async () => {
      replaceInFileButton.props.onClick();
      await flushPromises();
    });

    expect(replaceInRepo).toHaveBeenCalledWith('hello', 'hi', {
      caseSensitive: false,
      useRegex: false,
      filePaths: ['notes/note.md'],
    });
    expect(repoWide).toHaveBeenCalledTimes(2);
  });

  it('replaces all matches after confirmation', async () => {
    const result: RepoWideSearchResult = {
      filePath: 'notes/note.md',
      fileName: 'note.md',
      fullPath: '/repo/notes/note.md',
      matches: [
        {
          lineNumber: 4,
          lineContent: 'hello world',
          matchStart: 0,
          matchEnd: 5,
          contextBefore: '',
          contextAfter: '',
        },
      ],
    };

    const repoWide = jest.fn().mockResolvedValue({ ok: true, data: [result] });
    const replaceInRepo = jest.fn().mockResolvedValue({
      ok: true,
      data: { totalReplacements: 1, filesProcessed: 1, filesModified: 1, errors: [] },
    });
    (global as any).window.notegitApi.search.repoWide = repoWide;
    (global as any).window.notegitApi.search.replaceInRepo = replaceInRepo;
    (global as any).window.confirm = jest.fn().mockReturnValue(true);

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectMatch: jest.fn(),
        })
      );
    });

    const fields = renderer!.root.findAllByType(TextField);
    const queryField = fields.find((field) => field.props.label === REPO_SEARCH_TEXT.findLabel);
    const replaceField = fields.find((field) => field.props.label === REPO_SEARCH_TEXT.replaceLabel);
    if (!queryField || !replaceField) {
      throw new Error('Query or replace field not found');
    }

    act(() => {
      queryField.props.onChange({ target: { value: 'hello' } });
      replaceField.props.onChange({ target: { value: 'hi' } });
    });

    const searchButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.searchButton);
    if (!searchButton) {
      throw new Error('Search button not found');
    }

    await act(async () => {
      searchButton.props.onClick();
      await flushPromises();
    });

    const replaceAllButton = findButtonByText(renderer!, REPO_SEARCH_TEXT.replaceAllButton);
    if (!replaceAllButton) {
      throw new Error('Replace all button not found');
    }

    await act(async () => {
      replaceAllButton.props.onClick();
      await flushPromises();
    });

    expect(replaceInRepo).toHaveBeenCalledWith('hello', 'hi', {
      caseSensitive: false,
      useRegex: false,
    });

    const updatedFields = renderer!.root.findAllByType(TextField);
    const updatedQuery = updatedFields.find((field) => field.props.label === REPO_SEARCH_TEXT.findLabel);
    const updatedReplace = updatedFields.find((field) => field.props.label === REPO_SEARCH_TEXT.replaceLabel);
    expect(updatedQuery?.props.value).toBe('');
    expect(updatedReplace?.props.value).toBe('');
  });
});
