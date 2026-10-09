# Isolated Cypress regression

Runs the existing Cypress specs registered in `e2e/environment/specs.mjs` against a local Anvil Sepolia fork and Safe backend services. Scenario setup creates test owners, funded Safes, token balances and transactions through the SDK and local APIs. The CI workflow selects a subset; see `.github/workflows/web-isolated-e2e-backend.yml`.

## Setup

Install the monorepo dependencies and follow the [backend requirements](../environment/infra/README.md). Copy `apps/web/e2e/environment/infra/.env.test.sample` to `.env.test` in the same directory and provide `SEPOLIA_FORK_RPC_URL`.

From the monorepo root:

```sh
yarn workspace @safe-global/web e2e:env:test
yarn workspace @safe-global/web e2e:env up
yarn workspace @safe-global/web e2e:env build
REVERSE_PROXY_UI_PORT=3080 yarn workspace @safe-global/web serve
```

In another terminal:

```sh
yarn workspace @safe-global/web e2e:env cypress
```

Use `e2e:env cypress-open` for interactive runs. To select registered specs:

```sh
SAFE_E2E_SPECS=regression/assets yarn workspace @safe-global/web e2e:env cypress
```

`SAFE_E2E_WEB_URL` overrides the default wallet URL, `http://localhost:3080`. `SAFE_E2E_BROWSER` accepts Chrome/Chromium or an executable path and defaults to `chrome`. Headless runs retain videos, screenshots and JUnit reports under `apps/web/e2e/environment/artifacts/cypress/`; starting another headless run clears those artifacts.

## Cleanup

Stop the wallet server, then remove the backend containers and volumes:

```sh
yarn workspace @safe-global/web e2e:env reset
```

Reset the entire owned stack after an Anvil crash to keep chain and backend state consistent. Ordinary Cypress runs retain their staging configuration.

Cypress prepares each scenario in shared support before spec hooks run. Existing `getSafes()` calls read the prepared addresses; repeated reads do not create additional Safes. Scenario `fixtures` values supply generated transaction IDs through fixture getters, which resolve values when tests read them. Ordinary runs retain the original fixture defaults. Tests use the same actions and assertions against both backends.

Scenarios can return a `files` map keyed by existing JSON fixture paths. Cypress reads those prepared files from a temporary directory; checked-in fixtures remain unchanged. This connects existing response fixtures to seeded backend records when tests open their details. The history smoke scenario uses this to supply the indexed ID of a real QTRUST transfer while preserving the original assertions.

Specs that resolve ENS names against the generated owner use `setEnsName`, which sets the forward and reverse records on the fork by impersonating the name owner and the address.

The local Sepolia chain enables the features that staging serves to `WALLET_WEB`, so existing specs see the same UI. `setup_test_chain.py` lists the exceptions and their reasons.

## CI

`.github/workflows/web-isolated-e2e-backend.yml` builds the wallet and the Transaction Builder once. The selected specs run in parallel jobs, each with its own backend. Each job starts its backend while the build runs and waits for the build before it starts Cypress. `node apps/web/e2e/environment/run.mjs plan` splits the selection, honouring `SAFE_E2E_SPECS` and `SAFE_E2E_SHARDS`. Only the shards with specs that need the mainnet or Polygon fork start those forks; the planner fills them up with other specs, so that all shards end at about the same time. Those shards need the `FORK_RPC_URL_MAINNET` and `FORK_RPC_URL_POLYGON` secrets next to `SEPOLIA_FORK_RPC_URL`. Dispatch the workflow manually to run every registered spec. On a pull request, the `isolated-e2e-full` label runs every registered spec in six shards on each push; remove the label to return to the short selection. Each shard runs its specs in one Cypress process. With `CYPRESS_RECORD_KEY` set, each shard records to Cypress Cloud as its own group (`isolated shard N`) under one build per workflow run.

## Seeded data

- Each run generates four wallets. `OWNER_4`, `OWNER_1`, `OWNER_2` and `OWNER_3` get the roles their credentials have on staging.
- `scenarios/staging-safes.mjs` holds the on-chain state of staging static Safes at the fork block: owners, threshold, nonce, balances, tokens and spending limits. `rebuildStagingSafes` deploys them, executing as impersonated owners where no key exists. Staging wallets that sign in tests map to the generated owners.
- `aliasedStorage` in `cypress/support/fixture.js` serializes localStorage fixtures with staging static Safe addresses replaced by the Safes prepared under the same keys. `storageFixture` replaces the whole value with a scenario fixture.
- History that predates the fork cannot be indexed. Scenarios replay it after the fork block instead.
- A spec's `skips` in `specs.mjs` lists the cases that need hosted providers or the production app, with a reason each; isolated runs skip them.

## Adding a spec

1. Add the spec path to `isolatedSpecs` in `e2e/environment/specs.mjs` with the name of its scenario function, and `chains`, `perTest` or `skips` if it needs them.
2. Write the scenario as `export async function prepare<Name>Scenario(env, owners)` in a module under `e2e/environment/scenarios/` and import that module in `scenarios/index.mjs`. It returns `{ safes, fixtures, files }`: `safes` by category and key as `getSafes()` returns them, `fixtures` for fixture getters, `files` for JSON fixtures to replace.
3. Build data with the shared modules: `safe.mjs` (`createSafe`, `openSafe`, `proposeTransaction`, `executeTransaction`), `staging.mjs` and `staging-safes.mjs` for staging snapshots, `chain.mjs` for fork primitives, and `indexing.mjs` (`waitUntil`, `waitForQueued`) to wait until CGW serves the data before the spec runs.
4. Run `yarn workspace @safe-global/web e2e:env:test`; it checks that every registered spec exists, names a scenario function, and that its skipped titles exist.

## Extra services and chains

- `cow-api` answers as `api.cow.fi` for the gateway with recorded orders and returns 404 for anything else (`COW_API_OFFLINE`); without that flag it forwards unknown requests to the real API, for recording. Scenarios register replayed settlements in it.
- `relay-api` stands in for the relay provider and executes relayed transactions on the fork. The chain config offers `FREE_DAILY_LIMIT` relaying and sponsored Safe creation, plus `SUBSCRIPTION` relaying for Safes in a Workspace on a plan.
- `billing-api` stands in for the billing service, so `SAFE_PRO` is on as in production. Every Workspace has the staging Business trial, which the mock announces to the gateway with a signed webhook the first time the gateway reads it; the gateway then writes the Workspace's entitlements. Scenarios store a plan with `POST /billing/__test/customers/<space uuid>/subscriptions` (optional `plan` of `business` or `starter`, `status` and `metadata`), which returns once the gateway has applied it.
- Specs whose `chains` in `specs.mjs` name chain 1 or 137 need the mainnet or Polygon fork. Start them with `scripts/test_env.py up --chain mainnet` or `--chain polygon`.
- Each Anvil forks from a `fork-upstream` proxy that forwards to the secret RPC URL, so its fork cache has the same name for every provider and key. `infra/fork-cache/` holds the committed fork-block state; `test_env.py` copies it into `infra/.anvil-cache` before Anvil starts, and Anvil writes what it fetches on top when it stops. Delete `infra/.anvil-cache` to start again from the committed state.
- To refresh the committed cache, download the `.anvil-cache` folders that a full CI run uploads with each shard, and merge them per chain with `node apps/web/e2e/environment/fork-cache.mjs <committed file> <cache that Anvil wrote through the proxy> [more caches]`. The proxy's `GET /status` counts the requests that still reached the provider. All three forks usually share one provider key; bursts of new accounts can exhaust its quota.
- The stack, three forks and Cypress need about 6 GB of Docker memory.

## Safe Apps

The Transaction Builder specs need a production build of the monorepo builder on port 4000 and a simulation adapter on port 4003, which runs Tenderly-style simulations as Anvil `eth_call`s. The Vite dev server is not suitable: it reloads the page while optimizing dependencies, which breaks the first iframe load. From the monorepo root:

```sh
VITE_GATEWAY_URL=http://localhost:8000/cgw VITE_TENDERLY_SIMULATE_ENDPOINT_URL=http://localhost:4003/simulate \
  yarn workspace @safe-global/tx-builder exec vite build --config vite.config.ts
yarn workspace @safe-global/tx-builder exec vite preview --config vite.config.ts --host localhost --strictPort
SAFE_RPC_URL=http://localhost:8545 node apps/web/e2e/environment/simulation.mjs
```

Run the last two in separate terminals.

`VITE_GATEWAY_URL` makes the local CGW serve all of the builder's gateway requests and its only ABI source; scenarios register the ABIs the specs use. Isolated runs set the `TX_BUILDER_URL` Cypress variable to `http://localhost:4000`, the URL the local config service lists. Drain Account and the Safe Test App are not in this repository, so specs use their hosted builds, as on staging.
