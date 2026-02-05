import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Button, TextField, ToggleButtonGroup } from '@mui/material';
import { RepoSetupDialog } from '../../../frontend/components/RepoSetupDialog';
import { REPO_SETUP_TEXT } from '../../../frontend/components/RepoSetupDialog/constants';
import { REPO_PROVIDERS } from '../../../shared/types';

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

describe('RepoSetupDialog', () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        repo: {
          openOrClone: jest.fn(),
        },
      },
    };
  });

  it('shows error when git fields are missing', async () => {
    const openOrClone = jest.fn();
    (global as any).window.notegitApi.repo.openOrClone = openOrClone;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSetupDialog, {
          open: true,
          onClose: jest.fn(),
          onSuccess: jest.fn(),
        })
      );
    });

    const connectButton = findButtonByText(renderer!, REPO_SETUP_TEXT.connect);
    if (!connectButton) {
      throw new Error('Connect button not found');
    }

    await act(async () => {
      connectButton.props.onClick();
      await flushPromises();
    });

    expect(openOrClone).not.toHaveBeenCalled();
    const flatten = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(flatten).join('');
      return node.children ? node.children.map(flatten).join('') : '';
    };
    expect(flatten(renderer!.toJSON())).toContain(REPO_SETUP_TEXT.gitRequired);
  });

  it('connects to s3 when required fields are provided', async () => {
    const openOrClone = jest.fn().mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.repo.openOrClone = openOrClone;

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSetupDialog, {
          open: true,
          onClose,
          onSuccess,
        })
      );
    });

    const toggleGroup = renderer!.root.findByType(ToggleButtonGroup);
    act(() => {
      toggleGroup.props.onChange(null, REPO_PROVIDERS.s3);
    });

    const fields = renderer!.root.findAllByType(TextField);
    const setField = (label: string, value: string) => {
      const field = fields.find((item) => item.props.label === label);
      if (!field) {
        throw new Error(`Field not found: ${label}`);
      }
      act(() => {
        field.props.onChange({ target: { value } });
      });
    };

    setField('Bucket', 'my-bucket');
    setField('Region', 'us-east-1');
    setField('Access Key ID', 'AKIA123');
    setField('Secret Access Key', 'SECRET');

    const connectButton = findButtonByText(renderer!, REPO_SETUP_TEXT.connect);
    if (!connectButton) {
      throw new Error('Connect button not found');
    }

    await act(async () => {
      connectButton.props.onClick();
      await flushPromises();
    });

    expect(openOrClone).toHaveBeenCalledWith({
      provider: REPO_PROVIDERS.s3,
      bucket: 'my-bucket',
      region: 'us-east-1',
      prefix: '',
      localPath: '',
      accessKeyId: 'AKIA123',
      secretAccessKey: 'SECRET',
      sessionToken: '',
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('connects to local when name is provided', async () => {
    const openOrClone = jest.fn().mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.repo.openOrClone = openOrClone;

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RepoSetupDialog, {
          open: true,
          onClose,
          onSuccess,
        })
      );
    });

    const toggleGroup = renderer!.root.findByType(ToggleButtonGroup);
    act(() => {
      toggleGroup.props.onChange(null, REPO_PROVIDERS.local);
    });

    const field = renderer!.root
      .findAllByType(TextField)
      .find((item) => item.props.label === 'Local Repository Name');
    if (!field) {
      throw new Error('Local Repository Name field not found');
    }
    act(() => {
      field.props.onChange({ target: { value: 'My Notes' } });
    });

    const connectButton = findButtonByText(renderer!, REPO_SETUP_TEXT.connect);
    if (!connectButton) {
      throw new Error('Connect button not found');
    }

    await act(async () => {
      connectButton.props.onClick();
      await flushPromises();
    });

    expect(openOrClone).toHaveBeenCalledWith({
      provider: REPO_PROVIDERS.local,
      localPath: 'My Notes',
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
