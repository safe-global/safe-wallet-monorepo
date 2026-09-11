const preset = require('../../config/test/presets/jest-preset')

/**
 * Opt-in integration config: runs only `*.integration.test.ts` in a node
 * environment against a live Safenet network (sim :8546 / devnet :8547) selected
 * by `SAFENET_IT_RPC`. Excluded from the default config and from turbo — invoke
 * explicitly with `yarn test:integration`. Specs self-skip (with a clear message)
 * when `SAFENET_IT_RPC` is unset.
 */
module.exports = {
  ...preset,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.integration.test.ts'],
  collectCoverage: false,
}
