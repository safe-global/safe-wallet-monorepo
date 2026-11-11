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

The package is private for now and consumed from source inside the monorepo: its `exports` point at the `.tsx` files, and each app compiles them. The wallet still imports through the re-exports in `packages/views/src/components/ui` until it migrates. Styles and tokens are still provided by the app (`apps/web/src/styles/shadcn.css`).

## Semi-generated code

The components start from the shadcn/ui templates (`npx shadcn@latest add <name>`) and are then themed for Safe. So:

- they follow upstream patterns that may trip linters and code-health tools, and they are excluded from CodeScene (`.codescene.yml`)
- upstream updates may need a manual merge
- customisations belong in the component file; heavy ones belong in a wrapper in `packages/views`

## Stories

Stories live in `src/components/stories/` and render in the `apps/web` Storybook. Design-to-code mapping: [docs/figma-code-connect.md](docs/figma-code-connect.md).

Contributor rules: [AGENTS.md](AGENTS.md).
