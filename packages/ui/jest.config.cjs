const preset = require('../../config/test/presets/jest-preset')

/** @type {import('jest').Config} */
module.exports = {
  ...preset,
  rootDir: '.',
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', isolatedModules: true }],
  },
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: [...preset.testPathIgnorePatterns, '\\.stories\\.test\\.tsx$'],
}
