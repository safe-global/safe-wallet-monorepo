const preset = require('../../config/test/presets/jest-preset')

/**
 * Opt-in integration config: runs only `*.integration.test.ts` in a node
 * environment, read-only against live Gnosis Chain (the pinned Safenet
 * deployment) through the RPC in `SAFENET_IT_RPC`. Excluded from the default
 * config and from turbo — invoke explicitly with `yarn test:integration`.
 * Specs are skipped when `SAFENET_IT_RPC` is unset; once it is set, an RPC
 * failure or a missing historical request fails the run.
 */
module.exports = {
  ...preset,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.integration.test.ts'],
  collectCoverage: false,
}
