import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBar } from '../../frontend/components/StatusBar';
import type { RepoStatus } from '../../shared/types';

describe('StatusBar', () => {
  const baseStatus: RepoStatus = {
    provider: 'git',
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
      })
    );

    expect(html).toContain('CloudSyncIcon');
    expect(html).toContain('CloudDownloadIcon');
    expect(html).toContain('CloudUploadIcon');
  });

  it('hides fetch/pull/push buttons for s3 repos', () => {
    const html = renderToString(
      React.createElement(StatusBar, {
        status: { ...baseStatus, provider: 's3', branch: 'bucket-name' },
        onFetch: jest.fn(),
        onPull: jest.fn(),
        onPush: jest.fn(),
      })
    );

    expect(html).not.toContain('CloudSyncIcon');
    expect(html).not.toContain('CloudDownloadIcon');
    expect(html).not.toContain('CloudUploadIcon');
  });
});
