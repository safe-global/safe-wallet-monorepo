---
name: design-system.use
description: Build or restyle web UI with the Safe design system — pick the right primitive, preset and variant, and never restyle via className. Use whenever writing, reviewing or changing any UI in apps/web or apps/web-tanstack, including "make this button bigger", "style this card", "add a dialog", or when a design-system lint guard fires.
argument-hint: '[what you are building or the file to fix]'
allowed-tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
---

# Build UI with the design system

The web design system lives in `packages/design-system`. Its contract is
`packages/design-system/AGENTS.md` — **read that file first**; this skill is the working procedure,
not a replacement for it.

**The rule everything follows:** a component's geometry and colour belong to its `variant`/`size`
props. `className` is layout only — `w-*`, margins, flex/grid placement. Writing `h-`, `p-`, `bg-`,
`rounded-`, `border` or `text-sm` on a design-system component is the drift this system exists to
prevent, and ~38 JSX elements are lint-guarded against it in both web apps.

## Procedure

### 1. Read the contract

```
packages/design-system/AGENTS.md
```

Non-negotiable. It carries the Button/Input/Card/Dialog decision matrices, the token traps
(`--input` is a fill, not a border; filled `secondary` only reads on white/card surfaces) and the
preset catalogue.

### 2. Find what already exists — do not invent

In order:

1. **Closed presets** (`packages/design-system/src/presets/`) — `SubmitButton`, `ActionBar` +
   `ActionButton`, `DialogActions`, `OnboardingFooter`, `IconAction`, `ChoiceButton`,
   `SplitMenuButton`. If one matches the intent, use it. They take semantic props and reject styling
   `className` at the type level.
2. **Primitives** (`packages/design-system/src/components/`) — 50 of them. Read the target file's
   `cva` block: the variant values carry comments saying _when_ to use each one.
3. **The stories** — `UI/<Component>` in the design-system Storybook is the exhaustive reference.

```bash
ls packages/design-system/src/presets packages/design-system/src/components
```

In `apps/web`, note the two deliberate wrappers: import **`@/components/common/DialogActions`**
(it supplies the `<CheckWallet>` gate), and Safe-domain atoms like `EthHashInfo`, `TokenIcon`,
`CopyButton`, `ExplorerButton`, `EnhancedTable`, `TableCard` stay app-side.

### 3. Compose with props

```tsx
import { Button } from '@safe-global/design-system/components/button'

// Yes — variant carries emphasis, size carries the box, className carries layout.
<Button variant="default" size="action" className="w-full lg:w-auto">Confirm</Button>

// No — every one of these is lint-flagged and drifts from every other button.
<Button className="h-10 rounded-lg bg-primary px-6 text-sm">Confirm</Button>
```

Choosing:

- **Emphasis** → `variant`. One filled `default` per surface/row. `secondary` is filled but only
  reads on white/card surfaces — on the muted page background use `outline`, or `surface` when a
  secondary action must stay filled on a coloured surface. `ghost` for low-emphasis, icon, toolbar
  and inline text actions. `destructive` is the one destructive style.
- **Box** → `size`. `action` for a surface's main CTA, `submit` for modal/flow submits (adds the
  stable min-width — never hand-roll `min-w-[…]`), `lg` for form steps, `default`, `sm` for
  compact/toolbar/cards, `xl` only via `OnboardingFooter`.
- **Colour** → always a token (`bg-card`, `text-muted-foreground`, `border-border`). Never a hex,
  never `gray-*`. A hard-coded colour is invisible to the theme switch.

### 4. When nothing fits

Do **not** reach for `className`. Pick one:

- **The pattern recurs (~3+ places)** → add a variant to the primitive. Use
  `/design-system.add-variant`.
- **Genuinely one-off** → the sanctioned escape, on the primitive, with a reason:
  ```tsx
  // eslint-disable-next-line no-restricted-syntax -- <why the variants can't express this>
  ```
  Greppable and review-visible. Closed presets have no escape by design — if you think one needs it,
  the preset needs a prop.

### 5. Verify

```bash
yarn verify:changed:web       # type-check + lint + prettier + tests, scoped to your changes
```

The lint guards are the check that matters here. If one fires, the message names the prop you should
have used — read it rather than disabling it.

## Anti-patterns

| Don't                                           | Do                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `<Button className="h-10 px-6">`                | `<Button size="action">`                                              |
| `<Card className="p-0 gap-0">`                  | `<Card size="none">`                                                  |
| `<Input className="h-11 border bg-white">`      | `<Input inputSize="lg">`                                              |
| `<DialogContent className="max-w-[900px] p-0">` | `<DialogContent size="md" padding="none">`                            |
| `<DialogHeader className="border-b">`           | `<DialogHeader divided>`                                              |
| `border-input` for a visible edge               | `border-border` (`--input` is the field _fill_)                       |
| `bg-[#f5f5f5]`, `text-gray-500`                 | `bg-muted`, `text-muted-foreground`                                   |
| Hand-rolled Cancel/Confirm footer               | `DialogActions`                                                       |
| Hand-rolled submit + spinner                    | `SubmitButton`                                                        |
| A new `styles.module.css` for a component       | Tailwind utilities + `cn()` — CSS modules are invisible to the guards |

## Renders unstyled?

The semantic tokens are scoped to `.shadcn-scope`, deliberately not `:root`. Anything rendering
design-system components must sit inside `<ShadcnProvider>` — `apps/web` mounts it once in
`AppProviders`, and both Storybooks mount it as a decorator. Outside it, components have no tokens.

If a _new_ app or package renders these components, also add its `src` to the `@source` directives in
`packages/design-system/src/styles/tokens.css`. Tailwind v4 only emits utilities it saw in a scanned
tree, and a missing entry produces no error — just unstyled output.
