# @safe-global/ui

Safe UI, Safe's design system for React web apps: [shadcn/ui](https://ui.shadcn.com/) primitives built on Base UI (`@base-ui/react`), Tailwind CSS v4 and `class-variance-authority`, and Safe components composed from them.

## Usage

The package has two layers, each with its own subpath family. There is no root barrel.

| Layer           | Subpath                             | What it holds                                                                           |
| --------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| Primitives      | `@safe-global/ui/primitives/<name>` | The shadcn/ui components (button, dialog, table, …)                                     |
| Safe components | `@safe-global/ui/components/<name>` | Safe's own components composed from primitives (data table, widget, expandable list, …) |

```tsx
import { Button } from '@safe-global/ui/primitives/button'
import { Card, CardContent } from '@safe-global/ui/primitives/card'
import { DataTable, DataTableCard } from '@safe-global/ui/components/data-table'
import { cn } from '@safe-global/ui/utils'
import { useIsMobile } from '@safe-global/ui/hooks/use-mobile'
import { ShadcnProvider } from '@safe-global/ui/provider'
```

The package is private for now and consumed from source inside the monorepo: its `exports` point at the `.tsx` files, and each app compiles them. The wallet still imports through the re-exports in `packages/views/src/components/ui` until it migrates.

The flat keys of the first release (`@safe-global/ui/button`, …) are **deprecated** aliases of `@safe-global/ui/primitives/<name>`. They stay, frozen to today's 52 names, until the wallet migrates (Phase 2), because wallet tests mock them. New code uses the canonical subpaths, and no flat key is ever added.

## Styles

The package ships its CSS. Tailwind CSS v4 is a peer dependency, and the app keeps the `tailwindcss` import and the `@source` lines, because only the app knows where its `node_modules` is:

```css
@import 'tailwindcss';
@import '@safe-global/ui/styles.css';
@source '../node_modules/@safe-global/ui/src';
```

Adjust the `@source` path to point at the installed package from your CSS file. Dark mode is the `dark` class on an ancestor, usually `<html class="dark">`.

| Entry                        | Use it for                                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@safe-global/ui/styles.css` | The default: the Tailwind theme, the tokens on `:root` / `.dark` and the shadcn base styles                                                                                                                                                               |
| `@safe-global/ui/scoped.css` | Apps that coexist with another style system (the wallet and MUI): tokens and preflight apply only inside `.shadcn-scope` (`ShadcnProvider`). It expects the host to declare the theme's `--color-*` variables on `:root`, as the wallet's `vars.css` does |
| `@safe-global/ui/tokens.css` | The token variables only, without Tailwind                                                                                                                                                                                                                |

`tokens.css` puts the palette variables on `.dark`, while the wallet's `vars.css` uses `[data-theme='dark']`. The token values come from `@safe-global/theme`; the token files are generated, so never edit them by hand (see [AGENTS.md](AGENTS.md)).

## Semi-generated code

The primitives start from the shadcn/ui templates (`npx shadcn@latest add <name>`) and are then themed for Safe. So:

- they follow upstream patterns that may trip linters and code-health tools, and they are excluded from CodeScene (`.codescene.yml`)
- upstream updates may need a manual merge
- customisations belong in the component file; heavy ones belong in a wrapper in `packages/views`

## Stories

Every component has its own folder, `src/primitives/<name>/` or `src/components/<name>/`, holding the component, its test and its story (`<name>.stories.tsx`). Primitive stories are titled `UI/<Name>`, Safe component stories `Safe UI/<Name>`. They render in the `apps/web` Storybook with the wallet's scoped CSS, and in this package's own Storybook (`yarn workspace @safe-global/ui storybook`) with the default `styles.css`. Design-to-code mapping: [docs/figma-code-connect.md](docs/figma-code-connect.md).

The docs site in [`apps/design-system`](../../apps/design-system) documents every component (see its [Installation page](../../apps/design-system/content/docs/docs/installation.mdx)) and serves a shadcn registry, so an app can also copy a component with `npx shadcn add @safe/<name>`. It writes primitives to the app's `components/ui/` and Safe components to its `components/`.

Contributor rules: [AGENTS.md](AGENTS.md).
