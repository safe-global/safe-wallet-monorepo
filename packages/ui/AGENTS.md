# UI package guidelines

`@safe-global/ui` is Safe UI, the design system: generic shadcn/ui primitives built on Base UI (`@base-ui/react`), Tailwind v4 and `cva`, plus `cn`, the responsive hooks and `ShadcnProvider`. It is web only; mobile does not use it. Design tokens and CSS still live in `apps/web/src/styles/shadcn.css` until Phase 1 of [specs/005-safe-ui-design-system](../../specs/005-safe-ui-design-system/spec.md).

## Rules

- **Only generic, domain-free primitives live here.** No business logic, address parsing, chains, store, SDK calls or Safe-specific widgets: compose those in `packages/views` on top of a primitive (see `packages/views/src/components/common/AddressPasteInput`).
- **Framework agnostic.** No `next`, `next/*` or `next-themes`, no `@safe-global/*` workspace packages and no app aliases (`@/…`). Lint enforces this and `tsconfig.json` drops the inherited `paths`.
- **Imports inside the package are relative** (`./button`, `../lib/utils`) and must resolve inside `src/`. Consumers compile the source with their own resolver, so a package alias would not resolve for them. `src/relative-imports.test.ts` fails on a relative import that leaves `src/`, and lint rejects one that climbs three or more levels.
- **Every component file gets an `exports` key** in `package.json` (`"./<name>": "./src/components/<name>.tsx"`). There is no root barrel. `src/package-exports.test.ts` fails when a key is missing or points at a missing file.
- Tests sit next to the component (`<name>.test.tsx`). Stories go in `src/components/stories/<name>.stories.tsx` with an explicit `title`, so story IDs stay stable.
- Until Phase 2, `packages/views/src/components/ui/<name>` re-exports each component, and app code keeps importing it through that path. A new component also needs that one-line re-export (`export * from '@safe-global/ui/<name>'`).
- In jest, mock a primitive by its real path (`jest.mock('@safe-global/ui/<name>')`), not the `views` re-export, or the mock misses the package's internal imports.

## Adding a component with the shadcn CLI

`apps/web/components.json` still points at `views` until Phase 2, so `npx shadcn@latest add <name>` from `apps/web` writes into `packages/views/src/components/ui/`. Then:

1. Move the file to `src/components/` here and make its imports relative.
2. Add its `exports` key, its re-export file in `views` and a story.
3. Read [README.md](README.md) on the semi-generated code.

## Checks

The stories render in the `apps/web` Storybook (both `.storybook` and `.storybook-vite` include `packages/ui/src`). The tests run here and in `apps/web` jest (its `roots` include `packages/ui/src`).

```bash
yarn workspace @safe-global/ui type-check
yarn workspace @safe-global/ui lint
yarn workspace @safe-global/ui test
yarn workspace @safe-global/web type-check     # also covers the stories and drawer.stories.test.tsx
yarn workspace @safe-global/web build-storybook
```
