import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBar } from '../../../frontend/components/StatusBar';
import type { RepoStatus } from '../../../shared/types';
import { REPO_PROVIDERS } from '../../../shared/types';

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

    expect(html).not.toContain('CloudSyncIcon');
    expect(html).not.toContain('CloudDownloadIcon');
    expect(html).not.toContain('CloudUploadIcon');
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
    expect(unsavedHtml).not.toContain('CloudSyncIcon');
    expect(unsavedHtml).not.toContain('CloudDownloadIcon');
    expect(unsavedHtml).not.toContain('CloudUploadIcon');
  });
});
