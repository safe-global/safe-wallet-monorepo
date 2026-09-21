const preset = require('../../config/test/presets/jest-preset')

module.exports = {
  ...preset,
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  testEnvironment: 'jest-fixed-jsdom',
  // Opt-in integration specs (`*.integration.test.ts`) hit a live devnet and are
  // run separately via `yarn test:integration` — never in the default/turbo run.
  testPathIgnorePatterns: [...(preset.testPathIgnorePatterns ?? []), '\\.integration\\.test\\.ts$'],
}
