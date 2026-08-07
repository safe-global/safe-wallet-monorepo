const preset = require('../../config/test/presets/jest-preset')

/** @type {import('jest').Config} */
module.exports = {
  ...preset,
  rootDir: '.',
  // jest-fixed-jsdom matches the rest of the monorepo and keeps MSW usable
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Override the preset transform so TSX compiles with the automatic JSX runtime
  // (the app's tsconfig uses jsx: "preserve" for Vite, which Jest can't run).
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', isolatedModules: true }],
  },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    // App path aliases — mirror tsconfig.json "paths". This app reuses apps/web source.
    '^@/public/(.*)$': '<rootDir>/../web/public/$1',
    '^@/storybook/(.*)$': '<rootDir>/../web/.storybook/$1',
    '^@/(.*)$': '<rootDir>/../web/src/$1',
    '^src/(.*)$': '<rootDir>/../web/src/$1',
    // next/* compatibility shims live in this app's src/compat
    '^next/router$': '<rootDir>/src/compat/next-router.tsx',
    '^next/link$': '<rootDir>/src/compat/next-link.tsx',
    '^next/head$': '<rootDir>/src/compat/next-head.tsx',
    '^next/dynamic$': '<rootDir>/src/compat/next-dynamic.tsx',
    '^next/image$': '<rootDir>/src/compat/next-image.tsx',
    '^next/app$': '<rootDir>/src/compat/next-app.ts',
    '^next/navigation$': '<rootDir>/src/compat/next-navigation.tsx',
    '^next/dist/client/resolve-href$': '<rootDir>/src/compat/next-resolve-href.ts',
  },
  testMatch: ['<rootDir>/src/**/*.(spec|test).[jt]s?(x)'],
  // Coverage: collect from app source only (preset targets packages/**)
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.test.{ts,tsx}',
    '!<rootDir>/src/**/*.stories.tsx',
  ],
  coverageReporters: ['text-summary', 'json', 'lcov', 'html'],
  // plugins/ has its own node:test suite; cypress + dist are not unit tests
  testPathIgnorePatterns: [
    '<rootDir>/node_modules',
    '<rootDir>/dist',
    '<rootDir>/e2e',
    '<rootDir>/cypress',
    '<rootDir>/plugins',
  ],
}
