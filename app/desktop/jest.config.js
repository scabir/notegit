module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/unit-tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    'src/frontend/**/*.{ts,tsx}',
    '!src/backend/**/*.d.ts',
    '!src/backend/index.ts',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '\\.html\\?raw$': '<rootDir>/src/unit-tests/__mocks__/rawHtmlMock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/unit-tests/setup.ts'],
};
