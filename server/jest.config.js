module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|nanoid|uuid|before-after-hook|universal-user-agent|@octokit\\/.*)/)',
  ],

  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      isolatedModules: true,
      useESM: false
    }],
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  testTimeout: 10000,
  verbose: true,
};
