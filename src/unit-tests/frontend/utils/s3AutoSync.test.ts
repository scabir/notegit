import { getS3AutoSyncIntervalMs, startS3AutoSync } from '../../../frontend/utils/s3AutoSync';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('s3AutoSync', () => {
  it('calculates interval with fallback and minimum', () => {
    expect(getS3AutoSyncIntervalMs()).toBe(30000);
    expect(getS3AutoSyncIntervalMs(0)).toBe(30000);
    expect(getS3AutoSyncIntervalMs(1)).toBe(1000);
    expect(getS3AutoSyncIntervalMs(5)).toBe(5000);
  });

  it('starts and refreshes when enabled', async () => {
    jest.useFakeTimers();

    const deps = {
      startAutoPush: jest.fn().mockResolvedValue({ ok: true }),
      getStatus: jest.fn().mockResolvedValue({
        ok: true,
        data: {
          provider: 's3',
          branch: 'bucket',
          ahead: 0,
          behind: 0,
          hasUncommitted: false,
          pendingPushCount: 0,
          needsPull: false,
        },
      }),
      listTree: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      setStatus: jest.fn(),
      setTree: jest.fn(),
    };

    const cleanup = startS3AutoSync(true, 2, deps);
    await flushPromises();

    expect(deps.startAutoPush).toHaveBeenCalled();
    expect(deps.getStatus).toHaveBeenCalledTimes(1);
    expect(deps.listTree).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000);
    await flushPromises();

    expect(deps.getStatus).toHaveBeenCalledTimes(2);
    expect(deps.listTree).toHaveBeenCalledTimes(2);

    cleanup();
    jest.useRealTimers();
  });

  it('does nothing when disabled', async () => {
    jest.useFakeTimers();

    const deps = {
      startAutoPush: jest.fn().mockResolvedValue({ ok: true }),
      getStatus: jest.fn(),
      listTree: jest.fn(),
      setStatus: jest.fn(),
      setTree: jest.fn(),
    };

    const cleanup = startS3AutoSync(false, 2, deps);
    await flushPromises();
    jest.advanceTimersByTime(2000);
    await flushPromises();

    expect(deps.startAutoPush).not.toHaveBeenCalled();
    expect(deps.getStatus).not.toHaveBeenCalled();
    expect(deps.listTree).not.toHaveBeenCalled();

    cleanup();
    jest.useRealTimers();
  });
});
