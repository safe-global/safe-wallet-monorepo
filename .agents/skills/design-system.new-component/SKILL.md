---
name: design-system.new-component
description: Add a new primitive or closed preset to the Safe design system, with cva variants, a Storybook story, a colocated test and a lint guard. Use when a genuinely new UI building block is needed in packages/design-system, or when asked to "add a component to the design system", "create a new primitive", or "make this a shared component".
argument-hint: '[component name and what it is for]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Add a component to the design system

Read `packages/design-system/AGENTS.md` first. Everything here lands in both `apps/web` and
`apps/web-tanstack`, so a new component is a shared commitment, not a local convenience.

## 1. Decide it belongs here at all

The design system holds only what is generic. **Keep out** anything that reads Redux, RTK Query, the
router, wallets, chains or `next/*`, and anything Safe-domain (`EthHashInfo`, `TokenIcon`,
`CopyButton`, `EnhancedTable`…). Those live in `apps/web`.

Litmus test: **if its story would need an MSW handler or a store decorator, it is an app component.**
The design-system Storybook has neither, on purpose.

If a component is _mostly_ generic but needs one piece of host behaviour, **invert it** — take a
render prop and let the app supply that piece.
`packages/design-system/src/presets/DialogActions/index.tsx` is the worked example: it owns the
footer's layout and variants, and takes a `confirmGate` render prop instead of importing the app's
`<CheckWallet>`. The app then keeps a thin wrapper (`apps/web/src/components/common/DialogActions`)
so existing call sites are unchanged.

## 2. Primitive or preset?

- **Primitive** (`src/components/<name>.tsx`, lowercase-dashed) — a new visual building block.
  Prefer generating it so it matches the other 50:
  ```bash
  cd apps/web && npx shadcn@latest add <name>
  ```
  then move the generated file into `packages/design-system/src/components/`, repoint its imports at
  `../utils/cn` and sibling `./<component>` files, and check it against the neighbours.
- **Preset** (`src/presets/<Name>/index.tsx`, PascalCase dir) — a fixed composition of existing
  primitives for a recurring intent. Presets are the anti-drift layer: they take semantic props, own
  their styling, and **`Omit` styling `className` from their props type** so misuse is a compile
  error, not a lint catch. Copy the shape from `src/presets/SubmitButton/index.tsx`.

## 3. Write it

````tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

/**
 * What it is, and when to reach for it rather than the neighbouring component.
 *
 * @example
 * ```tsx
 * <Thing variant="outline" size="sm" />
 * ```
 */
const thingVariants = cva('…base classes…', {
  variants: {
    // Each value gets a comment saying WHEN to use it — that comment is what the next
    // engineer, designer and agent read.
    variant: { default: '…', outline: '…' },
    size: { default: '…', sm: '…' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

function Thing({ className, variant, size, ...props }: Props) {
  return <div data-slot="thing" className={cn(thingVariants({ variant, size, className }))} {...props} />
}

export { Thing, thingVariants }
````

Requirements:

- **Tokens only** — `bg-card`, `text-muted-foreground`, `border-border`. No hex, no `gray-*`.
  `--input` is the field _fill_; a visible edge is `border-border`.
- **Both themes.** Check light and dark; tokens usually handle it, raw values never do.
- **`data-slot`** on each rendered element, matching the other primitives — the guards and the
  `in-data-[slot=…]` variants rely on it.
- **No CSS module.** Tailwind utilities + `cn()`. Classes in a CSS module are invisible to the lint
  guards, which is how a component quietly stops following the rules.
- **Never `any`.** Derive props from the underlying element/primitive
  (`React.ComponentProps<'div'> & VariantProps<typeof thingVariants>`).

## 4. Export it

Add to `packages/design-system/src/index.ts` (primitives in the alphabetical `export *` block,
presets in the presets block). Subpath imports work without this, but the barrel is the package's
inventory.

## 5. Story — required

`packages/design-system/src/stories/<name>.stories.tsx`, titled `UI/<Name>` (or `Presets/<Name>`).
`meta.title` is mandatory: untitled stories get auto-titled from their file path and litter the
sidebar.

Cover **every variant and size**, and every significant state — default, hover, focus, disabled,
loading, error, empty. This story is the surface designers review; a state missing from it will drift.
For showcase-style pages reuse the `gallery-kit` helpers (`Family`, `Row`, `Swatch`).

## 6. Test — required

Colocated `<name>.test.tsx`. Test **behaviour and contract**, not appearance — appearance is
Storybook's job and Argos's. Good subjects: the right element/role renders, a `variant`/`size` prop
reaches the DOM, disabled blocks the handler, an overlay portals into `.shadcn-scope` rather than
`document.body`.

## 7. Lint guard — if it owns geometry or colour

Add a guard in `packages/design-system/eslint/rules.cjs` and a case in `eslint/rules.test.ts`. Without
one, call sites can override the variants freely and the component drifts. The test matters because a
selector that stops matching fails **silently** — lint goes green and the rule is simply gone.

## 8. Document it

If the component introduces a rule or a trap, add it to `packages/design-system/AGENTS.md`. If it is
a preset, add it to the preset catalogue there.

## 9. Verify

```bash
yarn verify:ds
yarn verify:web
yarn workspace @safe-global/design-system storybook   # look at it in both themes
```
