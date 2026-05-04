# Shared Packages AI Contributor Guidelines

Guidance for shared libraries under `packages/` consumed by both `apps/web/` and `apps/mobile/`. For monorepo-wide rules, see the root [AGENTS.md](../AGENTS.md).

## Shared Packages

- **Cross-Platform Code** – Shared logic goes in `packages/` directory. Consider both web and mobile when making changes.
- **Environment Handling** – Use dual environment variable patterns (`NEXT_PUBLIC_*` || `EXPO_PUBLIC_*`) in shared packages. Web apps use `NEXT_PUBLIC_*`; mobile apps use `EXPO_PUBLIC_*`. Check for both prefixes in package code.
- **Store Management** – The Redux store in `packages/store/` is shared between web and mobile. State changes must work for both platforms.
- **Theme Package** – `packages/theme/` is the single source of truth for design tokens. See the root AGENTS.md "Unified Theme System" section for usage and modification guidance.

## Auto-generated files

Never manually edit:

- `packages/utils/src/types/contracts/` — generated from contract ABIs.
- `packages/store/src/gateway/AUTO_GENERATED/` — generated from `schema.json`. Run `yarn workspace @safe-global/store build:dev` to regenerate.

CI will fail if AUTO_GENERATED files don't match the schema.

## Testing across platforms

When changing shared code, run tests for both consumers:

```bash
yarn workspace @safe-global/web test
yarn workspace @safe-global/mobile test
```

Ensure shared package tests work in both web and mobile environments — test files should not assume DOM globals or React Native primitives.
