# Design System — the contract

`@safe-global/design-system` is the single source of truth for how Safe{Wallet} looks on the web.
It owns the token layer, the UI primitives, the closed presets built from them, and the Storybook
the design team works in. Both `apps/web` and `apps/web-tanstack` render these components.

This file is the contract. It is tool-agnostic on purpose: Claude Code, Cursor and Copilot should
all be pointed here rather than given their own copy — duplicated rules drift, which is the exact
failure this package exists to prevent.

**The one rule, if you read nothing else:** a component's geometry and colour belong to its
`variant`/`size` props. `className` is for **layout only** — width, margins, flex/grid placement.
If you are writing `h-`, `p-`, `bg-`, `rounded-`, `border` or `text-sm` on a design-system
component, stop: either a variant already exists, or one should.

## Where things live

| Thing                  | Path                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| Primitives             | `src/components/*.tsx`                                           |
| Closed presets         | `src/presets/<Name>/index.tsx`                                   |
| Scope provider         | `src/components/ShadcnProvider.tsx`                              |
| Semantic tokens        | `src/styles/tokens.css`                                          |
| Brand vars (generated) | `src/styles/brand-vars.css`                                      |
| Stylesheet entry       | `src/styles/index.css` → `@safe-global/design-system/styles.css` |
| Lint guards            | `eslint/rules.cjs` (+ `eslint/index.mjs` for flat configs)       |
| Stories                | `src/stories/`, and colocated with each preset                   |
| Gallery furniture      | `src/stories/gallery-kit.tsx`                                    |

Primitives are generated from [shadcn/ui](https://ui.shadcn.com/) via the `shadcn` CLI and then
customised, so they carry upstream patterns (duplication between slots, wide prop spreads) that are
intentional. Don't "clean them up" to satisfy a code-health tool.

## Importing

Subpath imports are the norm — they keep the graph explicit and let bundlers drop what a screen
doesn't use:

```tsx
import { Button } from '@safe-global/design-system/components/button'
import SubmitButton from '@safe-global/design-system/presets/SubmitButton'
import { cn } from '@safe-global/design-system/utils/cn'
```

The barrel (`@safe-global/design-system`) exists for the cases where one import of several
primitives reads better.

**Every design-system component must render inside a `<ShadcnProvider>`** (or any `.shadcn-scope`
element). The semantic tokens are deliberately defined on `.shadcn-scope`, never on `:root`, so
that this package cannot restyle a host document it does not own. Outside the scope, components
render unstyled. `apps/web` mounts it once in `AppProviders`; both Storybooks mount it as a
decorator.

## Tokens

Two layers, both shipped by `styles/index.css`:

1. **`brand-vars.css`** — the `--color-*` brand palette on `:root` / `[data-theme='dark']`.
   **Generated. Never edit.** It comes from `@safe-global/theme`, which is also the source of the
   mobile app's Tamagui tokens. Change a brand colour there, then run:
   ```bash
   yarn workspace @safe-global/design-system css-vars
   ```
2. **`tokens.css`** — the semantic layer (`--background`, `--primary`, `--warning-strong`, …) on
   `.shadcn-scope`, the `@theme inline` block that turns them into Tailwind utilities
   (`bg-card`, `text-muted-foreground`), and the scoped Tailwind preflight. **This is the file to
   edit when a colour is wrong.**

Rules:

- **Never hard-code a colour** in a component or an app. Use a token. A hex in a `className` is
  invisible to the theme switch and to every future palette change.
- **Light and dark are always changed together.** `tokenContract.test.ts` fails if a themeable
  token is defined in one and not the other — because the silent version of that bug is a surface
  keeping its light colour on a dark background.
- **`--input` is the field _fill_, not a border colour** (`#fff` light / 5% white dark). A visible
  field or button edge uses `border-border`. Never `border-input`, never `border-gray-*`. The
  `Input`, `InputGroup` and `SelectTrigger` primitives already set both, so you should not be
  setting a field's border or background at all.
- **Filled `secondary` only reads on white/card surfaces.** On the muted page background use
  `variant="outline"` (transparent, reads via its hairline and a translucent hover), or
  `variant="surface"` when a secondary action must stay filled on a coloured surface.
- **Status tints** come in `subtle` (surface) / `muted` (mid) / `strong` (ink that clears AA on its
  own tint). The `*-dark` brand tokens are **accents, not inks** — they hold the same value in both
  themes and measure below AA as body text on their own tint. `semanticContrast.test.ts` pins this.
- **`@source` in `tokens.css` is load-bearing.** Tailwind v4 only generates utilities it saw in a
  scanned tree. Adding a consumer without adding it there produces no error — the component just
  renders unstyled. When a new app or package renders these components, add its `src` there.
- **Overlay z-index is a ladder, not decoration.** `--z-sidebar` → `--z-overlay` →
  `--z-nested-overlay` → `--z-above-onboard` → `--z-picker`, strictly increasing. A dialog opened
  from inside another overlay must beat it or the flow dead-ends;
  `apps/web`'s `walletModalZIndex.test.ts` pins the wallet-modal rung against `onboard.css`.

Designers: `Foundations/Colour`, `Foundations/Typography` and `Foundations/Spacing & radius` in
Storybook render all of the above live from the stylesheet. Those pages are the review surface.

## Variants over custom styling

Reach for a `variant`/`size` prop before a one-off `className`. If you are hand-rolling
padding/height/border/hover on a primitive, a variant probably exists; if the pattern recurs, add
one.

**This is enforced by ESLint**, not just documented. `eslint/rules.cjs` exports guards for 38 JSX
elements (Button, Card + slots, Input + slots, Tabs, Badge/Chip, Dialog/Sheet/Drawer + slots,
SelectTrigger, and the presets). They match the offending literal **even inside `cn(...)`**, and
they run in `apps/web`, `apps/web-tanstack` and this package's stories.

`eslint/rules.test.ts` asserts each guard still fires. That test exists because an AST selector
that stops matching fails **silently** — the lint run goes green and the rule is simply gone. Add a
guard, add a case.

**Rule of three:** if the same variant+size(+layout) combo appears in ~3 places, promote it to a
variant on the primitive or a preset — don't paste the classes a fourth time.

**The only sanctioned escape** is on a primitive, with a reason:

```tsx
// eslint-disable-next-line no-restricted-syntax -- <why the variants can't express this>
```

Greppable and review-visible. There are ~76 of these in `apps/web`; several say "pending a
variant", which is a to-do list. Closed presets have **no** escape by design.

Guards do not apply to the primitives' own implementations — a `cva` variant _is_ a hard-coded
`h-9 px-4`, and defining it in one place is the point.

### Highlights so agents don't rediscover them

- **Button — pick `variant` by emphasis:** `default` (the one filled primary per surface/row),
  `secondary` (filled — white/card surfaces only), `outline` (secondary on page/toolbar backgrounds,
  and dialog Cancel), `ghost` (low-emphasis / icon / toolbar / menu, and inline text actions),
  `destructive` (the one destructive style), `surface` (card-surface CTA on a coloured/promo
  surface — Earn/Stake/Add-funds). **Pick `size` by box:** `action` (px-6 CTA pill: Send/Receive/Swap,
  Confirm/Execute, Filter/Export, page-header primary actions), `submit` (`action` + a stable
  min-width for modal/flow submits — replaces magic `min-w-[…]`), `lg` (h-10 form-step buttons),
  `default` (h-9), `sm` (h-8 compact/toolbar/cards), `xl` (h-12 full-screen onboarding footer, via
  `OnboardingFooter`), plus `icon` / `icon-sm` / `icon-xs`. Full decision matrix and Do/Don't:
  the **`UI/Button` → Guidelines** story.
- **Input — `inputSize`**, not `size` (that name is taken by the native numeric attribute):
  `default` (h-9, matches `SelectTrigger`'s default so a field and a select on one row line up),
  `sm`, `lg`, `hero` (66px Safe-creation / big-filter field). Search bars are the one intentionally
  borderless field: `SearchInput` defaults to `variant="search"`.
- **Card** — `size` (`sm`/`default`/`lg`/`none`), `variant` (`outlined`/`muted`), `radius`.
  `size="none"` is how you get a padding-less card that hosts its own grid.
- **Dialog/Sheet/Drawer** — `DialogContent` owns width (`size`), body `padding` and `surface`;
  `DialogHeader`/`DialogFooter` own `divided`. `max-h-*`, `w-full`, flex/grid and overflow stay
  layout-only and are not flagged.

## Closed presets

For recurring intents, reach for a preset before the primitive. They take semantic props, own their
styling, and **accept no styling `className`** — it's `Omit`ted from their types, so
`<SubmitButton className="h-9">` is a _compile error_. That's a stronger guard than lint, which is
why neither humans nor AI can drift them.

- **`SubmitButton`** — modal/flow/settings submit (`size="submit"` + loading→spinner swap).
- **`ActionBar` + `ActionButton`** — CTA row; `ActionBar` owns gap/wrap, `ActionButton` locks
  `size="action"`, `variant` carries emphasis, `fullWidth` for stacked-mobile.
- **`DialogActions`** — the Cancel(outline) + Confirm(default/destructive) dialog footer: order,
  sizes, spinner, responsive layout. Named `DialogActions`, not `DialogFooter` (that's the layout
  slot). It takes a `confirmGate` render prop rather than knowing about wallets — **in `apps/web`
  import `@/components/common/DialogActions`**, the thin wrapper that supplies `<CheckWallet>`
  behind a `confirmCheckWallet` prop.
- **`OnboardingFooter`** — Back/Continue for full-screen onboarding (`size="xl"` 48px scale,
  chevrons, loading→spinner, stacked-mobile → row-on-xl).
- **`IconAction`** — the compact top-bar / header icon button (locks `variant="ghost"` +
  `size="icon-sm"`).
- **`ChoiceButton`** — the large choose-an-action tile.
- **`SplitMenuButton`** — one action plus alternate execution modes.

Layout composites (`ActionBar`, `DialogActions`) do take a `className`, but for **layout only** —
padding, margins, alignment — never button skin.

## Stories

Every component ships a story. In this package a story has no MSW, no Redux, no router: nothing
here fetches data or reads app state, so a story that needs mocking is a signal the component is an
app component and belongs in `apps/web`.

Taxonomy — four groups, and `meta.title` is **required** (untitled stories get auto-titled from
their lowercase file path and litter the sidebar):

| Group           | What belongs there                     |
| --------------- | -------------------------------------- |
| `Foundations/`  | The token layer, rendered live         |
| `Design System` | The curated designer-facing showcase   |
| `UI/`           | One exhaustive reference per primitive |
| `Presets/`      | One per closed preset                  |

A story should show every significant state — default, hover, focus, disabled, loading, error,
empty — and each variant/size. Use the `gallery-kit` helpers (`Family`, `Row`, `Swatch`,
`CatalogRow`, `WhereUsed`) for showcase pages so every gallery reads the same way.

Cross-Storybook links: `openStory`/`StoryLink` from the kit navigate locally for `Foundations/`,
`Design System`, `UI/` and `Presets/`, and open the app Storybook for `Components/`, `Features/`
and `Pages/` titles when `STORYBOOK_APP_URL` is set.

## What does NOT belong in this package

The boundary is the reason the package can stay fast and reviewable. Keep out:

- Anything reading Redux, RTK Query, the router, wallets, chains or `next/*`.
- Safe-domain components: `EthHashInfo`, `TokenIcon`, `CopyButton`, `ExplorerButton`,
  `EnhancedTable`, `TableCard`, and every feature component. They live in `apps/web` and are
  catalogued in its Storybook.
- Anything needing an MSW handler or a store decorator to render.

When a design-system component genuinely needs host behaviour, **invert it** — take a render prop
and let the app supply the behaviour. `DialogActions`'s `confirmGate` is the worked example.

## Adding to the design system

1. **Check it doesn't exist.** Search `src/components` and the `UI/` stories first.
2. **Primitive or preset?** A new visual building block is a primitive (prefer generating it with
   `npx shadcn@latest add <name>` so it matches the others). A fixed composition of existing
   primitives for a recurring intent is a preset.
3. **Variants, not props-per-style.** Express the axes with `cva` (`variant`, `size`, …) and give
   each value a comment saying _when_ to use it — that comment is what a reviewer and an agent read.
4. **Tokens only.** No hex, no `gray-*`.
5. **Story + test.** A story covering every variant/state, and a colocated `*.test.tsx` for
   behaviour (not appearance — appearance is Storybook's job).
6. **Document it here** if it introduces a rule, and **add a lint guard** in `eslint/rules.cjs`
   (plus a case in `rules.test.ts`) if it owns geometry or colour that a call site might override.
7. **Run the checks** (below) before committing.

## Commands

```bash
yarn workspace @safe-global/design-system storybook      # the design-system Storybook (port 6007)
yarn workspace @safe-global/design-system build-storybook
yarn workspace @safe-global/design-system css-vars       # regenerate brand-vars.css from @safe-global/theme
yarn workspace @safe-global/design-system test
yarn workspace @safe-global/design-system test:storybook # story snapshot tests
yarn verify:ds                                           # type-check + lint + prettier + test
yarn verify:changed:ds                                   # …scoped to changed files
```

Changing anything here changes both web apps, so also run `yarn verify:web` before committing.

## For designers

You need two things: this package and its Storybook. Nothing else.

- `yarn workspace @safe-global/design-system storybook` (or the published branch URL).
- **`Foundations/`** is where the design system's raw material lives — every colour, type style,
  spacing step and radius, read live from the code. This is the page to point at when something is
  wrong.
- **`Design System`** is the curated showcase: the components as they actually render, grouped by
  intent, with the open questions for review called out inline.
- **`UI/`** and **`Presets/`** are the exhaustive references — every variant, size and state.
- To change a colour, edit `src/styles/tokens.css`. To change a text style, edit
  `src/components/typography.tsx`. To change what a button looks like, edit the `cva` block in
  `src/components/button.tsx`. Each is one file, and the change lands everywhere at once.
- Brand colours come from `@safe-global/theme` (shared with mobile) and are **generated** into
  `brand-vars.css` — edit the theme package, then run `css-vars`.
