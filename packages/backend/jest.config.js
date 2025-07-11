// packages/backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.config.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**',
    '!**/logs/**',
    '!**/bin/**'
  ],
  testMatch: [
    '**/test/**/*.test.js'
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir