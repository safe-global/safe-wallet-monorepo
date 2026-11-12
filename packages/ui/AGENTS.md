# UI package guidelines

`@safe-global/ui` is Safe UI, the design system: generic shadcn/ui primitives built on Base UI (`@base-ui/react`), Tailwind v4 and `cva`, Safe components composed from them, plus `cn`, the responsive hooks and `ShadcnProvider`. It is web only; mobile does not use it. The package ships its own CSS ([specs/005-safe-ui-design-system](../../specs/005-safe-ui-design-system/spec.md)).

## Layers

| Layer           | Folder                             | Export key            | Story title      |
| --------------- | ---------------------------------- | --------------------- | ---------------- |
| Primitives      | `src/primitives/<name>/<name>.tsx` | `./primitives/<name>` | `UI/<Name>`      |
| Safe components | `src/components/<name>/<name>.tsx` | `./components/<name>` | `Safe UI/<Name>` |

- **Primitives** are the shadcn/ui components, semi-generated and managed with the shadcn CLI. A primitive may import another primitive (`../button/button`), `../../lib/*`, `../../hooks/*` and `../../provider`.
- **Safe components** are Safe's own generic patterns (table, widget, expandable list, …), built only from primitives, Base UI, `cn` and the hooks. The direction is one way: a Safe component imports primitives, never the reverse, and never another Safe component. `src/relative-imports.test.ts` and the `ui/layers` and `ui/components` lint blocks enforce it.
- `lib/`, `hooks/`, `provider.tsx` and `styles/` belong to neither layer and keep their keys. `src/primitives/anchored-surface.test.tsx` covers several primitives, so it sits at the layer root.
- A primitive and a Safe component never share a name: registry items, docs URLs and preview routes are one flat namespace.

## Rules

- **Only generic, domain-free code lives here.** No business logic, address parsing, chains, store, SDK calls or Safe-specific widgets: compose those in `packages/views` on top of a primitive or Safe component (see `packages/views/src/components/common/AddressPasteInput`). A Safe component takes its domain content (copy, cells, icons, links) through props and slots.
- **Framework agnostic.** No `next`, `next/*` or `next-themes`, no `@safe-global/*` workspace packages and no app aliases (`@/…`). Lint enforces this and `tsconfig.json` drops the inherited `paths`.
- **Imports inside the package are relative** (`../button/button`, `../../lib/utils`) and must resolve inside `src/`. Consumers compile the source with their own resolver, so a package alias would not resolve for them. `src/relative-imports.test.ts` fails on a relative import that leaves `src/`, and lint rejects one that climbs three or more levels.
- **Every component folder gets one canonical `exports` key** pointing straight at the component file: `"./primitives/<name>": "./src/primitives/<name>/<name>.tsx"` or `"./components/<name>": "./src/components/<name>/<name>.tsx"`. No `index.ts` barrels, no root barrel. `src/package-exports.test.ts` fails when a key is missing, points at a missing file or two layers share a name.
- **The flat keys are deprecated.** `"./<name>"` aliases exist for the 52 primitives of the first release only, point at the same file as `./primitives/<name>`, and are frozen (`LEGACY_FLAT_KEYS` in the export test) until Phase 2 removes them. Never add one, and never give a Safe component one.
- Each component's test (`<name>.test.tsx`) and story (`<name>.stories.tsx`, explicit `title` so story IDs stay stable) sit in its folder, next to companion files such as `table.module.css`.
- Until Phase 2, `packages/views/src/components/ui/<name>` re-exports each primitive, and app code keeps importing it through that path. A new primitive also needs that one-line re-export (`export * from '@safe-global/ui/primitives/<name>'`). Safe components get no `views` re-export; the wallet adopts them in Phase 2.
- In jest, mock a primitive by its real path (`jest.mock('@safe-global/ui/primitives/<name>')`), not the `views` re-export, or the mock misses the package's internal imports. Existing wallet tests mock the deprecated flat keys; that still works because both keys resolve to the same file.

## Styles and tokens

`src/styles/` holds the package CSS:

| File                 | What it is                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tailwind-theme.css` | Hand-written: `tw-animate-css`, `shadcn/tailwind.css`, the `dark` variant and the `@theme inline` mappings and scale settings    |
| `tokens.css`         | **Generated.** Unscoped tokens on `:root` / `.dark`, including the theme's palette variables. Exported as `./tokens.css`         |
| `tokens.scoped.css`  | **Generated.** The shadcn-named tokens on `.shadcn-scope` only. Internal                                                         |
| `styles.css`         | Default entry (`./styles.css`): theme + `tokens.css` + upstream shadcn base layer                                                |
| `scoped.css`         | Opt-in entry (`./scoped.css`) for apps that coexist with MUI, used by the wallet: theme + `tokens.scoped.css` + scoped preflight |

- Safe components get their own tokens there too when no shadcn token matches the wallet's look (`tone-*` for status accents, `widget-*`), so a component never falls back to a raw colour.
- **Never hand-edit `tokens.css` or `tokens.scoped.css`.** Token values live in `packages/theme` (`src/tokens/ui.ts` for the shadcn-named tokens, the palettes for `--color-*`). Edit there, then run `yarn workspace @safe-global/theme generate:ui-tokens`. `apps/web/src/styles/generatedCss.test.ts` fails in CI when a generated file is stale.
- `styles.css`, `scoped.css` and `tailwind-theme.css` hold no token values. Neither entry imports `tailwindcss`: the app owns that import and its `@source` lines.
- Every bare `@import` in `src/styles` must be a `dependencies` or `peerDependencies` entry (`src/styles/styles.test.ts`).

## Docs site and registry

`apps/design-system` (the Safe UI docs site and shadcn registry) reads this package the way an outside app does. It builds its previews from the stories, its props tables from the component types, its token pages from `tokens.css` / `tailwind-theme.css`, its Do/Don't cards from `eslint/design-system.mjs` (exported as `./eslint`) and the registry from `src/`. So:

- A story's `title`, its first exported story and its JSDoc show up on the docs page: the first story is the top preview, the others are Examples.
- Tag a story `docs-hidden` (`tags: ['docs-hidden']`) to keep it out of the docs; it stays in Storybook.
- Every new component needs a docs page: run `yarn workspace @safe-global/design-system scaffold:pages`, fill in the page, and commit it with the regenerated `apps/design-system/registry.json`. The docs tests fail otherwise.

## Adding a component with the shadcn CLI

`apps/web/components.json` still points at `views` until Phase 2, so `npx shadcn@latest add <name>` from `apps/web` writes into `packages/views/src/components/ui/`. Then:

1. Move the file to `src/primitives/<name>/<name>.tsx` here and make its imports relative.
2. Add its `./primitives/<name>` key, its re-export file in `views` and a story (`src/primitives/<name>/<name>.stories.tsx`).
3. Read [README.md](README.md) on the semi-generated code.

## Checks

The stories render in two Storybooks: the `apps/web` one (both `.storybook` and `.storybook-vite` include `packages/ui/src`) with the wallet's scoped CSS, which is the visual baseline, and this package's own (`.storybook/`, Vite, port 6007) with the default unscoped `styles.css` and a light/dark toolbar. The tests run here and in `apps/web` jest (its `roots` include `packages/ui/src`).

```bash
yarn workspace @safe-global/ui type-check
yarn workspace @safe-global/ui lint
yarn workspace @safe-global/ui test
yarn workspace @safe-global/ui build-storybook   # standalone Storybook
yarn workspace @safe-global/web type-check     # also covers the stories and drawer.stories.test.tsx
yarn workspace @safe-global/web build-storybook
```
