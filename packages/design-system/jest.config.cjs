const preset = require('../../config/test/presets/jest-preset')

module.exports = {
  ...preset,
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Must precede the preset's blanket stylesheet stub, which would swallow CSS modules and
    // silently drop their class names from rendered markup.
    '\\.module\\.css$': '<rootDir>/src/tests/cssModuleProxy.cjs',
    ...preset.moduleNameMapper,
    '^@safe-global/design-system/(.*)$': '<rootDir>/src/$1',
  },
  // The package tsconfig uses `moduleResolution: Bundler` so `tsc --noEmit` can read the
  // `exports` maps of subpath-only deps (@base-ui/react/*). ts-jest emits CommonJS, and
  // `Bundler` is invalid alongside it — so compile against an inline CJS tsconfig here and
  // leave type checking to the `type-check` task.
  transform: {
    // `.mjs` is included so the ESM lint-guard module (eslint/index.mjs) can be required by its
    // test — the rest of the package is .ts/.tsx.
    '^.+\\.(m?[tj]sx?)$': [
      'ts-jest',
      {
        diagnostics: false,
        isolatedModules: true,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'CommonJS',
          moduleResolution: 'node',
          target: 'ES2020',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          // The shared base sets `allowJs: false`, which makes ts-jest pass .js through
          // untransformed — including the ESM-only @storybook/* dist files the story snapshot
          // tests pull in. Without this they fail with "Cannot use import statement outside a
          // module" despite the transformIgnorePatterns carve-out below.
          allowJs: true,
        },
      },
    ],
  },
  // Stories are rendered by the Storybook sweep, not by `yarn test`. The `test:storybook` script
  // overrides this to run the story snapshot suites.
  testPathIgnorePatterns: [...preset.testPathIgnorePatterns, '\\.stories\\.test\\.tsx$'],
  // @storybook/* ships ESM only, so the story snapshot tests (which call composeStories) need it
  // transformed rather than required raw — same carve-out apps/web makes.
  transformIgnorePatterns: ['node_modules/(?!(@storybook|storybook)/)'],
}
