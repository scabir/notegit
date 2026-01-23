import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { renderToString } from 'react-dom/server';
import { Button, TextField } from '@mui/material';
import { CommitDialog } from '../../../frontend/components/CommitDialog';
import { COMMIT_DIALOG_TEXT } from '../../../frontend/components/CommitDialog/constants';

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

describe('CommitDialog', () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        files: {
          commitAll: jest.fn(),
        },
        repo: {
          push: jest.fn(),
        },
      },
    };
  });

  it('renders dialog container when open', () => {
    const html = renderToString(
      React.createElement(CommitDialog, {
        open: true,
        filePath: null,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    expect(html).toContain('MuiDialog-root');
  });

  it('commits and pushes when a message is provided', async () => {
    const commitAll = jest.fn().mockResolvedValue({ ok: true });
    const push = jest.fn().mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.commitAll = commitAll;
    (global as any).window.notegitApi.repo.push = push;

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(CommitDialog, {
          open: true,
          filePath: null,
          onClose,
          onSuccess,
        })
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: 'Update notes' } });
    });

    const commitButton = findButtonByText(renderer!, COMMIT_DIALOG_TEXT.confirm);
    if (!commitButton) {
      throw new Error('Commit button not found');
    }

    await act(async () => {
      commitButton.props.onClick();
      await flushPromises();
    });

    expect(commitAll).toHaveBeenCalledWith('Update notes');
    expect(push).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error when commit fails', async () => {
    (global as any).window.notegitApi.files.commitAll = jest
      .fn()
      .mockResolvedValue({ ok: false, error: { message: 'Commit failed' } });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(CommitDialog, {
          open: true,
          filePath: null,
          onClose: jest.fn(),
          onSuccess: jest.fn(),
        })
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: 'Bad commit' } });
    });

    const commitButton = findButtonByText(renderer!, COMMIT_DIALOG_TEXT.confirm);
    if (!commitButton) {
      throw new Error('Commit button not found');
    }

    await act(async () => {
      commitButton.props.onClick();
      await flushPromises();
    });

    const flatten = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(flatten).join('');
      return node.children ? node.children.map(flatten).join('') : '';
    };

    expect(flatten(renderer!.toJSON())).toContain('Commit failed');
  });

  it('shows validation error on Ctrl/Cmd+Enter when message is empty', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(CommitDialog, {
          open: true,
          filePath: null,
          onClose: jest.fn(),
          onSuccess: jest.fn(),
        })
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onKeyDown({ key: 'Enter', ctrlKey: true });
    });

    const flatten = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(flatten).join('');
      return node.children ? node.children.map(flatten).join('') : '';
    };

    expect(flatten(renderer!.toJSON())).toContain(COMMIT_DIALOG_TEXT.emptyMessageError);
  });
});
