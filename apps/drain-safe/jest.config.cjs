/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-fixed-jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.woff2$': '<rootDir>/src/test/fileMock.ts',
    '^@safe-global/theme/(.*)$': '<rootDir>/../../packages/theme/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowImportingTsExtensions: false,
          noEmit: false,
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@safe-global)/)'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

module.exports = config
