// Test setup file
// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock Electron app
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

