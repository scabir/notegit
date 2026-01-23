import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import App from '../../frontend/App';

jest.mock('@mui/material', () => {
  const React = require('react');
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: jest.fn(() => false),
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    CssBaseline: () => null,
  };
});

jest.mock('../../frontend/components/RepoSetupDialog', () => ({
  RepoSetupDialog: () => React.createElement('div', { 'data-testid': 'repo-setup-dialog' }),
}));

jest.mock('../../frontend/components/Workspace', () => ({
  Workspace: () => React.createElement('div', { 'data-testid': 'workspace' }),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  return node.children ? node.children.map(flattenText).join('') : '';
};

describe('App', () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        config: {
          checkGitInstalled: jest.fn(),
          getFull: jest.fn(),
          updateAppSettings: jest.fn(),
        },
      },
    };
  });

  it('shows git missing message when git is not installed', async () => {
    (global as any).window.notegitApi.config.checkGitInstalled.mockResolvedValue({ ok: true, data: false });
    (global as any).window.notegitApi.config.getFull.mockResolvedValue({ ok: true, data: { repoSettings: null } });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Git is not installed');
  });

  it('shows repo setup when no repository is connected', async () => {
    (global as any).window.notegitApi.config.checkGitInstalled.mockResolvedValue({ ok: true, data: true });
    (global as any).window.notegitApi.config.getFull.mockResolvedValue({
      ok: true,
      data: { repoSettings: null, appSettings: { theme: 'system' } },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain('Connect to Repository');
  });

  it('renders workspace when a repo is configured', async () => {
    (global as any).window.notegitApi.config.checkGitInstalled.mockResolvedValue({ ok: true, data: true });
    (global as any).window.notegitApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: 'git',
          remoteUrl: 'https://github.com/example/repo.git',
          branch: 'main',
          localPath: '/repo',
          pat: 'token',
          authMethod: 'pat',
        },
        appSettings: { theme: 'system' },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    const workspace = renderer!.root.findByProps({ 'data-testid': 'workspace' });
    expect(workspace).toBeTruthy();
  });
});
