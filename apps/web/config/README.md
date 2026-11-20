# Remote-config declaration (web)

`remote-config.json` declares the runtime feature flags the **web** app expects in
the Safe Config Service, scoped to the `WALLET_WEB` service. It is the
self-documenting, reviewed record of "which flags this release needs", validated
against `remote-config.schema.json`.

It does **not** change runtime behaviour — `hasFeature(chain, FEATURES.X)` still
reads the chain's `features` array from the gateway. This file is the source the
Config Service diffs against when seeding/verifying `Feature` rows for a release.

## Fields

| Field           | Maps to `Feature`     | Notes                                              |
| --------------- | --------------------- | -------------------------------------------------- |
| `key`           | `Feature.key`         | A `FEATURES` value that web code reads.            |
| `description`   | `Feature.description` | Code is authoritative.                             |
| `scope`         | `Feature.scope`       | `GLOBAL` or `PER_CHAIN`.                           |
| `enabled`       | Row exists            | `false`: reconcile does not create the flag.       |
| `defaultChains` | `Feature.chains`      | Release-time seed (chain IDs). Empty for `GLOBAL`. |

## Adding a flag

1. Add the key to the `FEATURES` enum in
   [`packages/utils/src/utils/chains.ts`](../../../packages/utils/src/utils/chains.ts).
2. Add a matching entry here (`key`, `description`, `scope`, `enabled`, `defaultChains`),
   with `"enabled": false`.
3. `remote-config.test.ts` (the sync test) fails if web code (`apps/web/src`,
   `packages/utils/src`, `packages/store/src`) reads a flag that is not declared, if a
   declared flag is not read anywhere, or if the file is schema-invalid.
4. Decide the flag's state on the default chains of the isolated E2E stack: add the key
   to `on` in
   [`test-chain-features.json`](../e2e/environment/infra/scripts/cfg_management/test-chain-features.json),
   or to `off`. The sync test fails until the flag is in one of them. A fork can switch
   on more flags through `TEST_CHAIN_EXTRA_FEATURES`, as the Ethereum fork does for
   `PORTFOLIO_ENDPOINT` and `POSITIONS`. The question of
   E2E coverage comes later, in the PR that releases the flag.

## Releasing a flag

A flag with `"enabled": false` is off everywhere: reconcile does not create its
`Feature` row. When the feature is ready, open a PR that changes it to `true`. That PR
is the place to confirm the definition of done, for example the E2E coverage. A flag
shared with mobile must have the same `enabled` value in both files.

The sync test requires E2E coverage for a released flag. Add the key to `flags` of the
specs that cover the feature in
[`playwright-specs.mjs`](../e2e/environment/playwright-specs.mjs). A flag in `flags` must be
`on` in the E2E stack, or in `TEST_CHAIN_EXTRA_FEATURES` of a fork that the spec lists in
`chains`. Otherwise the spec runs with the feature hidden. If no spec covers it,
give the reason in
[`released-without-e2e.json`](../e2e/environment/released-without-e2e.json), which QA or
the web team must approve.

On the PR that releases a flag, the isolated E2E workflow runs the covering specs 5
times (the `playwright burnin` job). A failure fails `Isolated E2E result`. The workflow
also posts a "Flag release checklist" comment for the reviewer.

After the release that contains the change, reconcile shows an `ADD`. For a
`PER_CHAIN` flag, choose the chains in the admin or seed them with `defaultChains`.
Changing `enabled` back to `false` makes reconcile offer to remove the row.

On release, an operator reconciles flags via the Config Service admin "Reconcile
flags" view. `defaultChains` is currently seeded empty for every flag; run the
Config Service `export_remote_config --service WALLET_WEB` command against
production and commit the result to make the seed authoritative.
