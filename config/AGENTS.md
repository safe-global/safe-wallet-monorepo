# Shared Config AI Contributor Guidelines

Guidance for the workspaces under `config/` (`test`, `eslint`, `tsconfig`). For monorepo-wide rules, see the root [AGENTS.md](../AGENTS.md). Most rules here concern `config/test` (`@safe-global/test`) — the shared test workspace with MSW handlers, fixture-based scenarios, faker factories, and the jest preset, consumed by **both** `apps/web` and `apps/mobile`.

## Verifying config/ changes (IMPORTANT)

`yarn verify:changed` only checks files under `apps/<workspace>/` — changed files under `config/` are **silently skipped**, so a green verify run says nothing about a config/ change. `@safe-global/test` has no test/lint/type-check scripts of its own; verify through its consumers instead:

```bash
yarn turbo run test --filter=@safe-global/web --filter=@safe-global/mobile --force
```

`--force` is required: turbo's `test` task doesn't hash `config/test` files, so without it a cached green pass can hide a breaking change. A change here can break both platforms' test suites at once.

## MSW fixtures are generated (never edit by hand)

The JSON files under `test/msw/fixtures/` are downloaded from the staging CGW by `test/msw/scripts/fetch-fixtures.ts` — treat them like `AUTO_GENERATED/` output. To refresh or add one:

```bash
node config/test/msw/scripts/fetch-fixtures.ts [--safe=ef-safe]
```

Without `--safe=<key>` it re-fetches and overwrites **all** fixtures. The flag only accepts the `=` form.

## Scenario names are a cross-workspace contract

The fixture scenario ids (`efSafe`, `vitalik`, `empty`, `spamTokens`, `safeTokenHolder`, defined in `test/msw/fixtures/index.ts` and `test/msw/handlers/fromFixtures.ts`) are consumed by name in three places — renaming or adding one touches all of them:

- `createMockStory` in web Storybook (`apps/web/src/stories/mocks/`)
- `apps/web/src/tests/scenario-utils.tsx` (+ `server.ts`)
- `apps/mobile/src/tests/server.ts` (+ `mocks.ts`)
