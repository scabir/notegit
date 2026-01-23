import React from 'react';
import type { ReactElement } from 'react';

const renderMock = jest.fn();
const createRootMock = jest.fn(() => ({ render: renderMock }));

jest.mock('react-dom/client', () => ({
  __esModule: true,
  default: {
    createRoot: createRootMock,
  },
  createRoot: createRootMock,
}));

jest.mock('../../frontend/App', () => () => React.createElement('div', { 'data-testid': 'app' }));

describe('frontend main', () => {
  beforeEach(() => {
    renderMock.mockClear();
    createRootMock.mockClear();
    (global as any).document = {
      getElementById: jest.fn(() => ({ id: 'root' })),
    };
  });

  it('creates the root and renders the app', () => {
    jest.isolateModules(() => {
      require('../../frontend/main');
    });

    expect(createRootMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledTimes(1);

    const element = renderMock.mock.calls[0][0] as ReactElement;
    expect(element.type).toBe(React.StrictMode);
    expect(element.props.children).toBeTruthy();
  });
});
