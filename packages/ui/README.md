# @safe-global/ui

Safe UI, Safe's design system for React web apps: [shadcn/ui](https://ui.shadcn.com/) components built on Base UI (`@base-ui/react`), Tailwind CSS v4 and `class-variance-authority`.

## Usage

Import each component from its own subpath. There is no root barrel.

```tsx
import { Button } from '@safe-global/ui/button'
import { Card, CardContent } from '@safe-global/ui/card'
import { cn } from '@safe-global/ui/utils'
import { useIsMobile } from '@safe-global/ui/hooks/use-mobile'
import { ShadcnProvider } from '@safe-global/ui/provider'
```

The package is private for now and consumed from source inside the monorepo: its `exports` point at the `.tsx` files, and each app compiles them. The wallet still imports through the re-exports in `packages/views/src/components/ui` until it migrates.

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

The components start from the shadcn/ui templates (`npx shadcn@latest add <name>`) and are then themed for Safe. So:

- they follow upstream patterns that may trip linters and code-health tools, and they are excluded from CodeScene (`.codescene.yml`)
- upstream updates may need a manual merge
- customisations belong in the component file; heavy ones belong in a wrapper in `packages/views`

## Stories

Stories live in `src/components/stories/`. They render in the `apps/web` Storybook with the wallet's scoped CSS, and in this package's own Storybook (`yarn workspace @safe-global/ui storybook`) with the default `styles.css`. Design-to-code mapping: [docs/figma-code-connect.md](docs/figma-code-connect.md).

Contributor rules: [AGENTS.md](AGENTS.md).
