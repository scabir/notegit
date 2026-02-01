import { GitHistoryProvider } from '../../../backend/providers/GitHistoryProvider';
import { ApiErrorCode, AuthMethod, GitRepoSettings } from '../../../shared/types';

describe('GitHistoryProvider', () => {
  const baseSettings: GitRepoSettings = {
    provider: 'git',
    remoteUrl: 'https://example.com/repo.git',
    branch: 'main',
    pat: 'token',
    authMethod: AuthMethod.PAT,
    localPath: '/repo',
  };

  it('rejects when not configured', async () => {
    const gitAdapter = {
      init: jest.fn(),
      log: jest.fn(),
      show: jest.fn(),
      diff: jest.fn(),
    };
    const provider = new GitHistoryProvider(gitAdapter as any);

    await expect(provider.getForFile('note.md')).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it('maps commit history entries', async () => {
    const gitAdapter = {
      init: jest.fn(),
      log: jest.fn().mockResolvedValue([
        {
          hash: 'abc',
          author_name: 'User',
          author_email: 'user@example.com',
          date: '2024-01-01T00:00:00Z',
          message: 'Initial commit',
        },
      ]),
      show: jest.fn(),
      diff: jest.fn(),
    };
    const provider = new GitHistoryProvider(gitAdapter as any);
    provider.configure(baseSettings);

    const history = await provider.getForFile('note.md');

    expect(gitAdapter.init).toHaveBeenCalledWith('/repo');
    expect(history[0]).toMatchObject({
      hash: 'abc',
      author: 'User',
      email: 'user@example.com',
      message: 'Initial commit',
    });
  });

  it('parses diff hunks with add/remove/context lines', async () => {
    const gitAdapter = {
      init: jest.fn(),
      log: jest.fn(),
      show: jest.fn(),
      diff: jest.fn().mockResolvedValue(
        [
          '@@ -1,2 +1,2 @@',
          '-old line',
          '+new line',
          ' context',
          '@@ -5,1 +5,2 @@',
          '+added',
        ].join('\n')
      ),
    };
    const provider = new GitHistoryProvider(gitAdapter as any);
    provider.configure(baseSettings);

    const hunks = await provider.getDiff('a', 'b', 'note.md');

    expect(hunks.length).toBe(2);
    expect(hunks[0].lines[0]).toMatchObject({ type: 'remove', content: 'old line' });
    expect(hunks[0].lines[1]).toMatchObject({ type: 'add', content: 'new line' });
    expect(hunks[0].lines[2]).toMatchObject({ type: 'context', content: 'context' });
  });
});
