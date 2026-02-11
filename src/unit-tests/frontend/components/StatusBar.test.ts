import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBar } from '../../../frontend/components/StatusBar';
import type { RepoStatus } from '../../../shared/types';
import { REPO_PROVIDERS } from '../../../shared/types';
import versionInfo from '../../../../version.json';

describe('StatusBar', () => {
  const baseStatus: RepoStatus = {
    provider: REPO_PROVIDERS.git,
    branch: 'main',
    ahead: 0,
    behind: 0,
    hasUncommitted: false,
    pendingPushCount: 0,
    needsPull: false,
  };

  it('shows fetch/pull/push buttons for git repos', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: baseStatus,
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        hasUnsavedChanges: false,
      })
    );

    expect(html).toContain('CloudSyncIcon');
    expect(html).toContain('CloudDownloadIcon');
    expect(html).toContain('CloudUploadIcon');
  });

  it('shows workspace actions in the status bar right section', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: baseStatus,
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        onOpenSearch: jest.fn(),
        onToggleHistory: jest.fn(),
        onSaveAll: jest.fn(),
        onCommitAndPush: jest.fn(),
        onOpenSettings: jest.fn(),
      })
    );

    expect(html).toContain('SearchIcon');
    expect(html).toContain('HistoryIcon');
    expect(html).toContain('SaveAltIcon');
    expect(html).toContain('SettingsIcon');
    expect(html).toContain('QuestionMarkRoundedIcon');
  });

  it('keeps settings and shortcuts as the far-right items in git mode', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: baseStatus,
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        onOpenSearch: jest.fn(),
        onToggleHistory: jest.fn(),
        onSaveAll: jest.fn(),
        onCommitAndPush: jest.fn(),
        onOpenSettings: jest.fn(),
      })
    );

    const fetchIndex = html.indexOf('Fetch from remote');
    const pullIndex = html.indexOf('Pull from remote');
    const pushIndex = html.indexOf('Push to remote');
    const settingsIndex = html.indexOf('Settings');
    const shortcutsIndex = html.indexOf('Keyboard Shortcuts');

    expect(fetchIndex).toBeGreaterThan(-1);
    expect(pullIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeGreaterThan(-1);
    expect(settingsIndex).toBeGreaterThan(pushIndex);
    expect(shortcutsIndex).toBeGreaterThan(settingsIndex);
  });

  it('renders header title and save status in the status bar', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: baseStatus,
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        headerTitle: `Work - ${versionInfo.version}`,
        saveStatus: 'saved',
        saveMessage: 'Saved locally',
      })
    );

    expect(html).toContain(`Work - ${versionInfo.version}`);
    expect(html).toContain('Saved');
    expect(html).toContain('Saved locally');
  });

  it('hides fetch/pull/push buttons for s3 repos', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: { ...baseStatus, provider: REPO_PROVIDERS.s3, branch: 'bucket-name' },
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        hasUnsavedChanges: false,
      })
    );

    expect(html).not.toContain('Fetch from remote');
    expect(html).not.toContain('Pull from remote');
    expect(html).not.toContain('Push to remote');
  });

  it('shows saved or uncommitted chip for local repos', () => {
    const savedHtml = renderToString(
      React.createElement(StatusBar, {
        status: { ...baseStatus, provider: REPO_PROVIDERS.local, branch: REPO_PROVIDERS.local },
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        hasUnsavedChanges: false,
      })
    );

    expect(savedHtml).toContain('Saved');

    const unsavedHtml = renderToString(
      React.createElement(StatusBar, {
        status: { ...baseStatus, provider: REPO_PROVIDERS.local, branch: REPO_PROVIDERS.local },
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
        hasUnsavedChanges: true,
      })
    );

    expect(unsavedHtml).toContain('Uncommitted changes');
    expect(unsavedHtml).not.toContain('HistoryIcon');
    expect(unsavedHtml).not.toContain('CloudSyncIcon');
    expect(unsavedHtml).not.toContain('CloudDownloadIcon');
    expect(unsavedHtml).not.toContain('CloudUploadIcon');
  });
});
