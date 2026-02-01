jest.setTimeout(10000);

const ensureWindowApi = (value: any) => {
  const windowValue = value || {};
  if (!windowValue.addEventListener) {
    windowValue.addEventListener = jest.fn();
  }
  if (!windowValue.removeEventListener) {
    windowValue.removeEventListener = jest.fn();
  }
  return windowValue;
};

let windowRef = ensureWindowApi((global as any).window);
Object.defineProperty(global, 'window', {
  configurable: true,
  get: () => windowRef,
  set: (value) => {
    windowRef = ensureWindowApi(value);
  },
});

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const stringArgs = args.filter((arg) => typeof arg === 'string') as string[];
  const combined = stringArgs.join(' ');
  if (
    combined.includes('Function components cannot be given refs') ||
    combined.includes('Invalid prop `children` supplied to `ForwardRef(Grow)`') ||
    combined.includes('Detected multiple renderers concurrently rendering the same context provider') ||
    combined.includes('useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError(...args);
};

jest.mock('@mui/material/Portal', () => {
  const React = require('react');
  const Portal = React.forwardRef(({ children }: { children: React.ReactNode }, ref: any) =>
    React.createElement('div', { ref }, children)
  );
  return {
    __esModule: true,
    default: Portal,
  };
});

jest.mock('@mui/material/Fade', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@mui/material/Collapse', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@mui/material/Modal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) =>
      open ? React.createElement('div', { className }, children) : null,
  };
});

jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.mock('remark-deflist', () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.mock('@codemirror/lang-markdown', () => ({
  __esModule: true,
  markdown: jest.fn(() => ({})),
}));

jest.mock('@codemirror/view', () => ({
  __esModule: true,
  EditorView: { lineWrapping: {} },
  keymap: {
    of: jest.fn(() => ({})),
  },
}));

jest.mock('@codemirror/state', () => ({
  __esModule: true,
  EditorSelection: {
    single: jest.fn(),
  },
}));

jest.mock('@uiw/codemirror-theme-github', () => ({
  __esModule: true,
  githubLight: {},
  githubDark: {},
}));

jest.mock('unist-util-visit', () => ({
  __esModule: true,
  visit: jest.fn(),
}));

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
