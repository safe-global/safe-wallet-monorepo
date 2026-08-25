# Shared Packages AI Contributor Guidelines

Guidance for shared libraries under `packages/` (`store`, `theme`, `utils`) consumed by both `apps/web/` and `apps/mobile/`. For monorepo-wide rules, see the root [AGENTS.md](../AGENTS.md).

## Verifying packages/ changes (IMPORTANT)

`yarn verify:changed` / `verify:changed:web` only checks files under `apps/<workspace>/` — changed files under `packages/` are **silently skipped** (`scripts/verify.mjs` filters on the `apps/<ws>/` prefix), so a green verify run says nothing about a packages/ change. Run the package's own checks instead:

```bash
yarn workspace @safe-global/<pkg> test|lint|type-check
```

To also cover dependents, use the turbo `--filter` command from the root AGENTS.md "Turborepo" section. CI runs package suites separately (`.github/workflows/package-utils-unit-tests.yml`) — a locally skipped check surfaces only in CI.

## Cross-platform constraints

- Package code runs on both platforms — don't assume DOM globals or React Native primitives in package source.
- Env vars: web injects `NEXT_PUBLIC_*`, mobile `EXPO_PUBLIC_*` — check for both prefixes in package code.
- New dependencies must work under both bundlers (Next.js/Vite and Metro). `utils` declares `@safe-global/protocol-kit`, `store`, `types-kit` as peerDependencies.

## Auto-generated files (never edit by hand)

- `packages/store/src/gateway/AUTO_GENERATED/` — generated from the committed `packages/store/scripts/api-schema/schema.json`.
  - Offline regen: `yarn workspace @safe-global/store generate-api && yarn workspace @safe-global/store write-schema-hash`
  - Validate sync without regenerating: `yarn workspace @safe-global/store check-sync`
  - `build:dev` first **re-fetches the schema from staging CGW over the network** and overwrites `schema.json` — needs network, clobbers a pinned schema.
- `packages/utils/src/types/contracts/` — typechain output; regenerate with `yarn workspace @safe-global/web generate-types` (also runs on `yarn install`).

CI fails if AUTO_GENERATED files don't match the schema.

## packages/store structure

Only `AUTO_GENERATED/` is generated. Hand-written code lives alongside it: RTK Query endpoints in `src/gateway/` (`chains/`, `cgwClient.ts`, `transactions.ts`), Redux slices in `src/slices/`, plus `safenet/` and `hypernative/`. New hand-written endpoints and slices go there. The store is consumed by both apps — state changes must keep working for web and mobile. Full codegen pipeline: [store/README.md](store/README.md).

## packages/theme

Single source of truth for design tokens on both platforms. Edit `src/palettes/` / `src/tokens/` — always update light **and** dark palettes together — then:

```bash
yarn workspace @safe-global/theme type-check
yarn workspace @safe-global/web css-vars   # regenerates apps/web/src/styles/vars.css — never hand-edit that file
```

No barrel export — import from sub-paths (`@safe-global/theme/palettes`, `/tokens/spacing`, `/tokens/typography`, `/generators/tamagui`).

## packages/utils integration tests

`yarn workspace @safe-global/utils test:integration` runs `*.integration.test.ts` against a **live Safenet devnet** (`SAFENET_IT_RPC`) and is excluded from default/turbo runs. Don't run it casually, and never name ordinary unit tests `*.integration.test.ts`.
