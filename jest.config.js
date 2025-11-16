module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    '!src/backend/**/*.d.ts',
    '!src/backend/index.ts',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

