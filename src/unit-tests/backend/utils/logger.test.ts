const createLoggerMock = jest.fn(() => ({
  add: jest.fn(),
}));

const format = {
  combine: jest.fn(() => 'combined'),
  timestamp: jest.fn(() => 'timestamp'),
  errors: jest.fn(() => 'errors'),
  splat: jest.fn(() => 'splat'),
  json: jest.fn(() => 'json'),
  colorize: jest.fn(() => 'colorize'),
  simple: jest.fn(() => 'simple'),
};

const transports = {
  File: jest.fn(),
  Console: jest.fn(),
};

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;

  const loadLogger = () => {
    jest.resetModules();
    jest.doMock('electron', () => ({
      app: {
        getPath: jest.fn(() => '/tmp/notegit-test'),
      },
    }));
    jest.doMock('winston', () => ({
      createLogger: createLoggerMock,
      format,
      transports,
    }));

    return jest.isolateModules(() => require('../../../backend/utils/logger'));
  };

  beforeEach(() => {
    createLoggerMock.mockClear();
    transports.File.mockClear();
    transports.Console.mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('creates a logger with file transports in production', () => {
    process.env.NODE_ENV = 'production';

    loadLogger();

    expect(createLoggerMock).toHaveBeenCalledTimes(1);
    const calls = createLoggerMock.mock.calls as any[];
    const config = calls[0]?.[0] as any;
    expect(Array.isArray(config?.transports)).toBe(true);
    expect(config?.transports).toHaveLength(2);
  });

  it('adds console transport in development', () => {
    process.env.NODE_ENV = 'development';

    const loggerModule = loadLogger() as any;

    expect(createLoggerMock).toHaveBeenCalledTimes(1);
    const loggerInstance = createLoggerMock.mock.results[0].value;
    expect(loggerInstance.add).toHaveBeenCalledTimes(1);
    expect(loggerModule).toBeTruthy();
  });
});
