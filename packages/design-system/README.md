# @safe-global/design-system

The Safe{Wallet} web design system: the token layer, the UI primitives, the closed presets built
from them, and the Storybook the design team works in.

Consumed by `apps/web` and `apps/web-tanstack`. Source-consumed like the other workspace packages —
no build step, no `dist/`.

```tsx
import { Button } from '@safe-global/design-system/components/button'
import SubmitButton from '@safe-global/design-system/presets/SubmitButton'
```

Load the stylesheet once per app, and wrap the tree in the scope provider — the semantic tokens are
scoped to `.shadcn-scope`, never `:root`, so components render unstyled outside it:

```tsx
import '@safe-global/design-system/styles.css'
import { ShadcnProvider } from '@safe-global/design-system/components/ShadcnProvider'
;<ShadcnProvider dark={isDarkMode}>{children}</ShadcnProvider>
```

## Start here

**[AGENTS.md](./AGENTS.md) is the contract** — read it before writing or restyling any UI. It covers
the token layer, the variants-over-`className` rule and its lint enforcement, the closed presets,
what belongs in this package and what doesn't, and how to add a component or a variant.

## Storybook

```bash
yarn workspace @safe-global/design-system storybook   # port 6007
```

Four groups: `Foundations/` (the tokens, rendered live from the stylesheet), `Design System` (the
curated showcase), `UI/` (an exhaustive reference per primitive) and `Presets/`.

Deliberately lighter than `apps/web`'s Storybook — no Next.js, Redux, MSW, wallet or chain mocks.
Nothing here fetches data or reads app state, so a story that needs mocking means the component is
an app component and belongs in `apps/web`.

## Built on

[shadcn/ui](https://ui.shadcn.com/) primitives (generated with the `shadcn` CLI, then customised)
over [Base UI](https://base-ui.com/), styled with Tailwind v4 and `class-variance-authority`.
Brand colours come from `@safe-global/theme`, shared with the mobile app, and are **generated** into
`src/styles/brand-vars.css`:

```bash
yarn workspace @safe-global/design-system css-vars
```

## Checks

```bash
yarn verify:ds            # type-check + lint + prettier + test
yarn verify:changed:ds    # …scoped to changed files
```

Changing anything here changes both web apps — run `yarn verify:web` too.
