module.exports = {
  preset: 'ts-jest',
  testEnvironment: '../../flakey-test-tracking/jest/jest/JestFlakeTrackingEnvironment.js',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['@celo/dev-utils/lib/matchers'],
  globalSetup: '<rootDir>/src/test-utils/ganache.setup.ts',
  globalTeardown: '<rootDir>/src/test-utils/ganache.teardown.ts',
  testSequencer: '<rootDir>/src/test-utils/AlphabeticSequencer.js',
  verbose: true,
}
