jest.setTimeout(10000);

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      if (name === 'userData') return '/tmp/notegit-test';
      return '/tmp';
    }),
  },
  ipcMain: {
    handle: jest.fn(),
  },
  BrowserWindow: jest.fn(),
}));

