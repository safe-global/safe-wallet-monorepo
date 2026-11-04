const preset = require('../../config/test/presets/jest-preset')

/**
 * Opt-in integration config: runs only `*.integration.test.ts` in a node
 * environment against live Gnosis selected by `SAFENET_IT_RPC`.
 * Excluded from the default config and from turbo — invoke
 * explicitly with `yarn test:integration`. Specs self-skip
 * when `SAFENET_IT_RPC` is unset.
 */
module.exports = {
  ...preset,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.integration.test.ts'],
  collectCoverage: false,
}
