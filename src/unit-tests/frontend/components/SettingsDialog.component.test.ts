import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Button, Tabs, TextField, ListItemButton, ToggleButtonGroup } from '@mui/material';
import { SettingsDialog } from '../../../frontend/components/SettingsDialog';
import type { FullConfig } from '../../../shared/types';
import { AuthMethod } from '../../../shared/types';

jest.mock('@mui/material', () => {
  const React = require('react');
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Tabs: ({ children, onChange, value }: any) =>
      React.createElement('div', { 'data-testid': 'tabs', onChange, value }, children),
    Tab: ({ label }: any) => React.createElement('div', null, label),
    Snackbar: ({ open, message }: any) =>
      React.createElement('div', { 'data-testid': 'snackbar', 'data-open': open }, message),
  };
});

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

const flattenText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  return node.children ? node.children.map(flattenText).join('') : '';
};

const buildConfig = (): FullConfig => ({
  appSettings: {
    autoSaveEnabled: false,
    autoSaveIntervalSec: 30,
    s3AutoSyncEnabled: true,
    s3AutoSyncIntervalSec: 30,
    theme: 'system',
    editorPrefs: {
      fontSize: 14,
      lineNumbers: true,
      tabSize: 2,
      showPreview: true,
    },
  },
  repoSettings: {
    provider: 'git',
    remoteUrl: 'https://github.com/example/repo.git',
    branch: 'main',
    localPath: '/repo',
    pat: 'token',
    authMethod: AuthMethod.PAT,
  },
  profiles: [
    {
      id: 'profile-1',
      name: 'Default',
      repoSettings: {
        provider: 'git',
        remoteUrl: 'https://github.com/example/repo.git',
        branch: 'main',
        localPath: '/repo',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      },
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    },
  ],
  activeProfileId: 'profile-1',
});

describe('SettingsDialog component', () => {
  let shellOpenPath: jest.Mock;

  beforeEach(() => {
    shellOpenPath = jest.fn();
    (global as any).window = {
      notegitApi: {
        config: {
          getFull: jest.fn().mockResolvedValue({ ok: true, data: buildConfig() }),
          updateRepoSettings: jest.fn().mockResolvedValue({ ok: true }),
          updateAppSettings: jest.fn().mockResolvedValue({ ok: true }),
          createProfile: jest.fn().mockResolvedValue({
            ok: true,
            data: {
              id: 'profile-2',
              name: 'New Profile',
              repoSettings: {
                provider: 'git',
                remoteUrl: 'https://github.com/example/new.git',
                branch: 'main',
                pat: 'token',
                authMethod: AuthMethod.PAT,
              },
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            },
          }),
          setActiveProfile: jest.fn(),
          restartApp: jest.fn(),
          deleteProfile: jest.fn(),
        },
        export: {
          note: jest.fn(),
          repoZip: jest.fn(),
        },
        logs: {
          getContent: jest.fn().mockResolvedValue({ ok: true, data: 'logs' }),
          export: jest.fn().mockResolvedValue({ ok: true }),
        },
        dialog: {
          showSaveDialog: jest.fn(),
          showOpenDialog: jest.fn(),
        },
      },
      require: jest.fn(() => ({
        shell: {
          openPath: shellOpenPath,
        },
      })),
      confirm: jest.fn(),
    };
    (global as any).confirm = jest.fn().mockReturnValue(true);
    (global as any).navigator = {
      clipboard: {
        writeText: jest.fn(),
      },
    };
  });

  it('loads config and saves repository settings', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    const updateRepoSettings = (global as any).window.notegitApi.config.updateRepoSettings;
    expect(updateRepoSettings).toHaveBeenCalledWith({
      provider: 'git',
      remoteUrl: 'https://github.com/example/repo.git',
      branch: 'main',
      localPath: '/repo',
      pat: 'token',
      authMethod: AuthMethod.PAT,
    });
  });

  it('saves app settings from the general tab', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const saveAppButton = findButtonByText(renderer!, 'Save App Settings');
    if (!saveAppButton) {
      throw new Error('Save App Settings button not found');
    }

    await act(async () => {
      saveAppButton.props.onClick();
      await flushPromises();
    });

    const updateAppSettings = (global as any).window.notegitApi.config.updateAppSettings;
    expect(updateAppSettings).toHaveBeenCalled();
  });

  it('creates a new git profile from the profiles tab', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const createNewButton = findButtonByText(renderer!, 'Create New Profile');
    if (!createNewButton) {
      throw new Error('Create New Profile button not found');
    }

    act(() => {
      createNewButton.props.onClick();
    });

    const fields = renderer!.root.findAllByType(Button);
    expect(fields.length).toBeGreaterThan(0);

    const profileNameField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Profile Name');
    const remoteUrlField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Remote URL');
    const branchField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Branch');
    const patField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Personal Access Token');

    if (!profileNameField || !remoteUrlField || !branchField || !patField) {
      throw new Error('Profile fields not found');
    }

    act(() => {
      profileNameField.props.onChange({ target: { value: 'New Profile' } });
      remoteUrlField.props.onChange({ target: { value: 'https://github.com/example/new.git' } });
      branchField.props.onChange({ target: { value: 'main' } });
      patField.props.onChange({ target: { value: 'token' } });
    });

    const createProfileButton = findButtonByText(renderer!, 'Create Profile');
    if (!createProfileButton) {
      throw new Error('Create Profile button not found');
    }

    await act(async () => {
      createProfileButton.props.onClick();
      await flushPromises();
    });

    const createProfile = (global as any).window.notegitApi.config.createProfile;
    expect(createProfile).toHaveBeenCalledWith('New Profile', {
      provider: 'git',
      remoteUrl: 'https://github.com/example/new.git',
      branch: 'main',
      pat: 'token',
      authMethod: AuthMethod.PAT,
    });
  });

  it('exports current note and repository', async () => {
    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockResolvedValue({ ok: true, data: '/tmp/note.md' });
    (global as any).window.notegitApi.export.repoZip = jest
      .fn()
      .mockResolvedValue({ ok: true, data: '/tmp/repo.zip' });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
          currentNoteContent: 'note',
          currentNotePath: 'note.md',
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 3);
    });

    const exportButtons = renderer!.root.findAllByType(Button);
    const exportNoteButton = exportButtons.find((button) => button.props.children === 'Export as Markdown (.md)');
    const exportRepoButton = exportButtons.find((button) => button.props.children === 'Export Repository as ZIP');

    if (!exportNoteButton || !exportRepoButton) {
      throw new Error('Export buttons not found');
    }

    await act(async () => {
      exportNoteButton.props.onClick();
      exportRepoButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.export.note).toHaveBeenCalledWith('note.md', 'note', 'md');
    expect((global as any).window.notegitApi.export.repoZip).toHaveBeenCalled();
  });

  it('switches profiles after confirmation', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(true);
    (global as any).window.notegitApi.config.setActiveProfile = jest
      .fn()
      .mockResolvedValue({ ok: true });
    const switchConfig = buildConfig();
    const repoSettings = switchConfig.repoSettings as NonNullable<FullConfig['repoSettings']>;
    switchConfig.profiles = [
      {
        id: 'profile-1',
        name: 'Default',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
      {
        id: 'profile-2',
        name: 'Side',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    ];
    switchConfig.activeProfileId = 'profile-1';
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: switchConfig });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const listButtons = renderer!.root.findAllByType(ListItemButton);
    const profileButton = listButtons.find(
      (node) => node.props.selected === false && node.props.disabled !== true
    );
    if (!profileButton) {
      throw new Error('Profile button not found');
    }

    jest.useFakeTimers();
    await act(async () => {
      await profileButton.props.onClick();
    });
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
    await act(async () => {
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.setActiveProfile).toHaveBeenCalled();
    expect((global as any).window.notegitApi.config.restartApp).toHaveBeenCalled();
  });

  it('copies repo path and opens folder', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const buttons = renderer!.root.findAllByType(Button);
    const copyPathButton = buttons.find((button) => button.props.children === 'Copy Path');
    const openFolderButton = buttons.find((button) => button.props.children === 'Open Folder');

    if (!copyPathButton || !openFolderButton) {
      throw new Error('Repo path buttons not found');
    }

    await act(async () => {
      copyPathButton.props.onClick();
      openFolderButton.props.onClick();
    });

    expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith('/repo');
    expect(shellOpenPath).toHaveBeenCalledWith('/repo');
  });

  it('loads logs and exports them', async () => {
    (global as any).window.notegitApi.dialog.showSaveDialog = jest.fn().mockResolvedValue({
      canceled: false,
      filePath: '/tmp/logs.log',
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    await act(async () => {
      tabs.props.onChange(null, 4);
      await flushPromises();
    });
    await act(async () => {
      await flushPromises();
    });

    expect((global as any).window.notegitApi.logs.getContent).toHaveBeenCalled();

    const exportLogsButton = renderer!.root
      .findAllByType(Button)
      .find((button) => button.props.children === 'Export Logs');
    if (!exportLogsButton) {
      throw new Error('Export Logs button not found');
    }

    await act(async () => {
      exportLogsButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.logs.getContent).toHaveBeenCalled();
    expect((global as any).window.notegitApi.logs.export).toHaveBeenCalledWith('combined', '/tmp/logs.log');
  });

  it('shows validation error when creating profile without a name', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const createNewButton = findButtonByText(renderer!, 'Create New Profile');
    if (!createNewButton) {
      throw new Error('Create New Profile button not found');
    }

    act(() => {
      createNewButton.props.onClick();
    });

    const createProfileButton = findButtonByText(renderer!, 'Create Profile');
    if (!createProfileButton) {
      throw new Error('Create Profile button not found');
    }

    await act(async () => {
      createProfileButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Profile name is required');
  });

  it('creates a new s3 profile from the profiles tab', async () => {
    (global as any).window.notegitApi.config.createProfile = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        id: 'profile-3',
        name: 'S3 Profile',
        repoSettings: {
          provider: 's3',
          bucket: 'bucket',
          region: 'us-east-1',
          prefix: 'notes/',
          localPath: '/repo',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
          sessionToken: '',
        },
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const createNewButton = findButtonByText(renderer!, 'Create New Profile');
    if (!createNewButton) {
      throw new Error('Create New Profile button not found');
    }

    act(() => {
      createNewButton.props.onClick();
    });

    const providerToggle = renderer!.root.findByType(ToggleButtonGroup);
    act(() => {
      providerToggle.props.onChange(null, 's3');
    });

    const profileNameField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Profile Name');
    const bucketField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Bucket');
    const regionField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Region');
    const prefixField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Prefix (optional)');
    const accessKeyField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Access Key ID');
    const secretField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Secret Access Key');

    if (!profileNameField || !bucketField || !regionField || !prefixField || !accessKeyField || !secretField) {
      throw new Error('S3 profile fields not found');
    }

    act(() => {
      profileNameField.props.onChange({ target: { value: 'S3 Profile' } });
      bucketField.props.onChange({ target: { value: 'bucket' } });
      regionField.props.onChange({ target: { value: 'us-east-1' } });
      prefixField.props.onChange({ target: { value: 'notes/' } });
      accessKeyField.props.onChange({ target: { value: 'key' } });
      secretField.props.onChange({ target: { value: 'secret' } });
    });

    const createProfileButton = findButtonByText(renderer!, 'Create Profile');
    if (!createProfileButton) {
      throw new Error('Create Profile button not found');
    }

    await act(async () => {
      createProfileButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.createProfile).toHaveBeenCalledWith('S3 Profile', {
      provider: 's3',
      bucket: 'bucket',
      region: 'us-east-1',
      prefix: 'notes/',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: '',
    });
  });

  it('saves S3 repository settings', async () => {
    const s3Config = buildConfig();
    s3Config.repoSettings = {
      provider: 's3',
      bucket: 'bucket',
      region: 'us-east-1',
      prefix: 'notes/',
      localPath: '/repo',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: '',
    };
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: s3Config });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.updateRepoSettings).toHaveBeenCalledWith({
      provider: 's3',
      bucket: 'bucket',
      region: 'us-east-1',
      prefix: 'notes/',
      localPath: '/repo',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: '',
    });
  });

  it('deletes a non-active profile', async () => {
    const deleteConfig = buildConfig();
    deleteConfig.profiles = [
      {
        id: 'profile-1',
        name: 'Default',
        repoSettings: deleteConfig.repoSettings as any,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
      {
        id: 'profile-2',
        name: 'Extra',
        repoSettings: deleteConfig.repoSettings as any,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    ];
    deleteConfig.activeProfileId = 'profile-1';
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: deleteConfig });
    (global as any).window.notegitApi.config.deleteProfile = jest.fn().mockResolvedValue({ ok: true });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const deleteButtons = renderer!.root.findAllByProps({ 'aria-label': 'delete' });
    if (deleteButtons.length === 0) {
      throw new Error('Delete profile button not found');
    }

    await act(async () => {
      deleteButtons[0].props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.deleteProfile).toHaveBeenCalledWith('profile-2');
  });

  it('copies logs to clipboard', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 4);
    });

    const refreshButton = renderer!.root
      .findAllByType(Button)
      .find((button) => button.props.children === 'Refresh');
    if (!refreshButton) {
      throw new Error('Refresh logs button not found');
    }

    await act(async () => {
      refreshButton.props.onClick();
      await flushPromises();
    });

    const copyButton = renderer!.root
      .findAllByType(Button)
      .find((button) => button.props.children === 'Copy to Clipboard');
    if (!copyButton) {
      throw new Error('Copy logs button not found');
    }

    await act(async () => {
      copyButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith('logs');
  });

  it('shows an error when config load fails', async () => {
    (global as any).window.notegitApi.config.getFull = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'load failed' },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('load failed');
  });

  it('invokes callbacks when app settings are saved', async () => {
    const onThemeChange = jest.fn();
    const onAppSettingsSaved = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
          onThemeChange,
          onAppSettingsSaved,
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const saveAppButton = findButtonByText(renderer!, 'Save App Settings');
    if (!saveAppButton) {
      throw new Error('Save App Settings button not found');
    }

    await act(async () => {
      saveAppButton.props.onClick();
      await flushPromises();
    });

    expect(onThemeChange).toHaveBeenCalledWith('system');
    expect(onAppSettingsSaved).toHaveBeenCalled();
  });

  it('shows validation error when git repo settings are incomplete', async () => {
    const gitConfig = buildConfig();
    gitConfig.repoSettings = {
      provider: 'git',
      remoteUrl: '',
      branch: 'main',
      localPath: '/repo',
      pat: '',
      authMethod: AuthMethod.PAT,
    };
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: gitConfig });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.updateRepoSettings).not.toHaveBeenCalled();
    expect(flattenText(renderer!.toJSON())).toContain('Please fill in all required Git fields');
  });

  it('shows error when exporting note without content', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 3);
    });

    const exportButtons = renderer!.root.findAllByType(Button);
    const exportNoteButton = exportButtons.find((button) => button.props.children === 'Export as Markdown (.md)');
    if (!exportNoteButton) {
      throw new Error('Export note button not found');
    }

    await act(async () => {
      exportNoteButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('No note is currently open');
  });

  it('renders S3 auto sync settings when repo is s3', async () => {
    const s3Config = buildConfig();
    s3Config.repoSettings = {
      provider: 's3',
      bucket: 'bucket',
      region: 'region',
      prefix: '',
      localPath: '/repo',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: '',
    };
    s3Config.appSettings = {
      ...s3Config.appSettings,
      autoSaveEnabled: true,
      s3AutoSyncEnabled: true,
    };
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: s3Config });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const autoSaveField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Auto-save Interval (seconds)');
    const s3AutoSyncField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'S3 Auto Sync (in seconds)');

    expect(autoSaveField).toBeTruthy();
    expect(s3AutoSyncField).toBeTruthy();
  });

  it('shows error when saving app settings fails', async () => {
    (global as any).window.notegitApi.config.updateAppSettings = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'app save failed' },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const saveAppButton = findButtonByText(renderer!, 'Save App Settings');
    if (!saveAppButton) {
      throw new Error('Save App Settings button not found');
    }

    await act(async () => {
      saveAppButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('app save failed');
  });

  it('shows error when repository settings save fails', async () => {
    (global as any).window.notegitApi.config.updateRepoSettings = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'repo save failed' },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('repo save failed');
  });

  it('shows validation error when s3 repo settings are incomplete', async () => {
    const s3Config = buildConfig();
    s3Config.repoSettings = {
      provider: 's3',
      bucket: '',
      region: 'region',
      prefix: '',
      localPath: '/repo',
      accessKeyId: 'key',
      secretAccessKey: '',
      sessionToken: '',
    };
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: s3Config });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.updateRepoSettings).not.toHaveBeenCalled();
    expect(flattenText(renderer!.toJSON())).toContain('Please fill in all required S3 fields');
  });

  it('does not switch profiles when confirmation is declined', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(false);
    const switchConfig = buildConfig();
    const repoSettings = switchConfig.repoSettings as NonNullable<FullConfig['repoSettings']>;
    switchConfig.profiles = [
      {
        id: 'profile-1',
        name: 'Default',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
      {
        id: 'profile-2',
        name: 'Side',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    ];
    switchConfig.activeProfileId = 'profile-1';
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: switchConfig });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const listButtons = renderer!.root.findAllByType(ListItemButton);
    const profileButton = listButtons.find(
      (node) => node.props.selected === false && node.props.disabled !== true
    );
    if (!profileButton) {
      throw new Error('Profile button not found');
    }

    await act(async () => {
      await profileButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.config.setActiveProfile).not.toHaveBeenCalled();
  });

  it('shows log load errors and skips export when canceled', async () => {
    (global as any).window.notegitApi.logs.getContent = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'log fail' },
    });
    (global as any).window.notegitApi.dialog.showSaveDialog = jest.fn().mockResolvedValue({
      canceled: true,
      filePath: undefined,
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    await act(async () => {
      tabs.props.onChange(null, 4);
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Error loading logs: log fail');

    const exportLogsButton = renderer!.root
      .findAllByType(Button)
      .find((button) => button.props.children === 'Export Logs');
    if (!exportLogsButton) {
      throw new Error('Export Logs button not found');
    }

    await act(async () => {
      exportLogsButton.props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.logs.export).not.toHaveBeenCalled();
  });

  it('shows error when config load throws', async () => {
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockRejectedValue(new Error('load boom'));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('load boom');
  });

  it('shows error when saving app settings throws', async () => {
    (global as any).window.notegitApi.config.updateAppSettings = jest
      .fn()
      .mockRejectedValue(new Error('app boom'));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const saveAppButton = findButtonByText(renderer!, 'Save App Settings');
    if (!saveAppButton) {
      throw new Error('Save App Settings button not found');
    }

    await act(async () => {
      saveAppButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('app boom');
  });

  it('shows error when saving repo settings throws', async () => {
    (global as any).window.notegitApi.config.updateRepoSettings = jest
      .fn()
      .mockRejectedValue(new Error('repo boom'));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 1);
    });

    const saveRepoButton = findButtonByText(renderer!, 'Save Repository Settings');
    if (!saveRepoButton) {
      throw new Error('Save Repository Settings button not found');
    }

    await act(async () => {
      saveRepoButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('repo boom');
  });

  it('shows error when export note throws', async () => {
    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockRejectedValue(new Error('export boom'));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
          currentNoteContent: 'note',
          currentNotePath: 'note.md',
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 3);
    });

    const exportButtons = renderer!.root.findAllByType(Button);
    const exportNoteButton = exportButtons.find((button) => button.props.children === 'Export as Markdown (.md)');
    if (!exportNoteButton) {
      throw new Error('Export note button not found');
    }

    await act(async () => {
      exportNoteButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('export boom');
  });

  it('shows error when export repo throws', async () => {
    (global as any).window.notegitApi.export.repoZip = jest
      .fn()
      .mockRejectedValue(new Error('repo export boom'));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 3);
    });

    const exportButtons = renderer!.root.findAllByType(Button);
    const exportRepoButton = exportButtons.find((button) => button.props.children === 'Export Repository as ZIP');
    if (!exportRepoButton) {
      throw new Error('Export repo button not found');
    }

    await act(async () => {
      exportRepoButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('repo export boom');
  });

  it('shows error when profile switch fails', async () => {
    (global as any).window.confirm = jest.fn().mockReturnValue(true);
    (global as any).window.notegitApi.config.setActiveProfile = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'switch failed' },
    });
    const switchConfig = buildConfig();
    const repoSettings = switchConfig.repoSettings as NonNullable<FullConfig['repoSettings']>;
    switchConfig.profiles = [
      {
        id: 'profile-1',
        name: 'Default',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
      {
        id: 'profile-2',
        name: 'Side',
        repoSettings,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    ];
    switchConfig.activeProfileId = 'profile-1';
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: switchConfig });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const listButtons = renderer!.root.findAllByType(ListItemButton);
    const profileButton = listButtons.find(
      (node) => node.props.selected === false && node.props.disabled !== true
    );
    if (!profileButton) {
      throw new Error('Profile button not found');
    }

    await act(async () => {
      await profileButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('switch failed');
  });

  it('shows error when profile creation fails', async () => {
    (global as any).window.notegitApi.config.createProfile = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'create failed' },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const createNewButton = findButtonByText(renderer!, 'Create New Profile');
    if (!createNewButton) {
      throw new Error('Create New Profile button not found');
    }

    act(() => {
      createNewButton.props.onClick();
    });

    const profileNameField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Profile Name');
    const remoteUrlField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Remote URL');
    const branchField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Branch');
    const patField = renderer!.root
      .findAllByType(TextField)
      .find((field: any) => field.props.label === 'Personal Access Token');

    if (!profileNameField || !remoteUrlField || !branchField || !patField) {
      throw new Error('Profile fields not found');
    }

    act(() => {
      profileNameField.props.onChange({ target: { value: 'Broken Profile' } });
      remoteUrlField.props.onChange({ target: { value: 'https://github.com/example/bad.git' } });
      branchField.props.onChange({ target: { value: 'main' } });
      patField.props.onChange({ target: { value: 'token' } });
    });

    const createProfileButton = findButtonByText(renderer!, 'Create Profile');
    if (!createProfileButton) {
      throw new Error('Create Profile button not found');
    }

    await act(async () => {
      createProfileButton.props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('create failed');
  });

  it('shows error when deleting profile fails', async () => {
    const deleteConfig = buildConfig();
    deleteConfig.profiles = [
      {
        id: 'profile-1',
        name: 'Default',
        repoSettings: deleteConfig.repoSettings as any,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
      {
        id: 'profile-2',
        name: 'Extra',
        repoSettings: deleteConfig.repoSettings as any,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    ];
    deleteConfig.activeProfileId = 'profile-1';
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({ ok: true, data: deleteConfig });
    (global as any).window.notegitApi.config.deleteProfile = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: 'delete failed' },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SettingsDialog, {
          open: true,
          onClose: jest.fn(),
        })
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const tabs = renderer!.root.findByType(Tabs);
    act(() => {
      tabs.props.onChange(null, 2);
    });

    const deleteButtons = renderer!.root.findAllByProps({ 'aria-label': 'delete' });
    if (deleteButtons.length === 0) {
      throw new Error('Delete profile button not found');
    }

    await act(async () => {
      deleteButtons[0].props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('delete failed');
  });
});
