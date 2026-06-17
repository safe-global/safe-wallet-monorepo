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
| `key`           | `Feature.key`         | Must be a value of the `FEATURES` enum.            |
| `description`   | `Feature.description` | Code is authoritative.                             |
| `scope`         | `Feature.scope`       | `GLOBAL` or `PER_CHAIN`.                           |
| `defaultChains` | `Feature.chains`      | Release-time seed (chain IDs). Empty for `GLOBAL`. |

## Adding a flag

1. Add the key to the `FEATURES` enum in
   [`packages/utils/src/utils/chains.ts`](../../../../packages/utils/src/utils/chains.ts).
2. Add a matching entry here (`key`, `description`, `scope`, `defaultChains`).
3. `remote-config.test.ts` (the sync test) fails if the enum and this file disagree
   or the file is schema-invalid.

On release, an operator reconciles flags via the Config Service admin "Reconcile
flags" view. `defaultChains` is currently seeded empty for every flag; run the
Config Service `export_remote_config --service WALLET_WEB` command against
production and commit the result to make the seed authoritative.
