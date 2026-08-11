---
name: design-system.add-variant
description: Add a variant or size to a design-system primitive instead of overriding styles at the call site. Use when a needed look has no variant, when the same className override appears in several places, when a design-system lint guard fires and no existing prop fits, or when asked to "add a variant/size" to a Button, Card, Input, Badge, Tabs, Dialog or any primitive.
argument-hint: '[component and the variant you need, e.g. "button: a compact toolbar size"]'
allowed-tools:
  - Read
  - Edit
  - Grep
  - Glob
  - Bash
---

# Add a variant to a primitive

This is the sanctioned way to make a new look possible. Adding a variant is a **shared, app-wide
change** — it lands in `apps/web` and `apps/web-tanstack` at once — so it is deliberate work, not a
quick edit. Read `packages/design-system/AGENTS.md` first.

## 1. Prove the need (rule of three)

Count the real call sites before adding anything. If the pattern appears in fewer than ~3 places and
isn't a documented design decision, it is a one-off: use the escape hatch instead
(`// eslint-disable-next-line no-restricted-syntax -- <reason>` on the primitive).

```bash
# Example: how often is a bespoke height set on a Button?
grep -rn '<Button[^>]*className="[^"]*h-' apps/web/src apps/web-tanstack/src | wc -l
# And the standing to-do list — escapes whose reason says a variant is missing:
grep -rn 'no-restricted-syntax --' apps/web/src | grep -i 'pending a variant'
```

Those "pending a variant" escapes are the highest-value work: each one is a call site that already
knows it wants a variant.

## 2. Check no existing variant fits

Read the `cva` block in `packages/design-system/src/components/<component>.tsx`. Every value carries
a comment saying when to use it. Two variants that differ only in a hue or 1px are worse than one —
prefer widening an existing variant's remit over adding a near-duplicate.

## 3. Add it

In the primitive's `cva` block:

```ts
const buttonVariants = cva('…base…', {
  variants: {
    size: {
      // Existing values…
      // Compact toolbar action: h-8 matches the filter row's inputs so a button and a field on
      // that row line up. Use for toolbar/table-header actions, not for a surface's main CTA
      // (that's `action`).
      toolbar: 'h-8 gap-1 px-3',
    },
  },
})
```

Requirements:

- **A comment saying _when_ to use it**, and how it differs from the neighbouring value. That comment
  is what the next engineer, the next designer and the next agent read — a variant without it gets
  misused and becomes drift with extra steps.
- **Tokens only.** No hex, no `gray-*`.
- **Both themes.** If the variant carries colour, verify light and dark. Tokens usually handle this;
  a raw value never does.
- **Name by role, not by looks.** `toolbar`, `submit`, `hero` — not `h8`, `small2`, `blue`.

## 4. Update the exhaustive story

`packages/design-system/src/stories/<component>.stories.tsx` — the `UI/<Component>` story is the
reference designers review. A variant missing from it does not exist as far as design is concerned.
Add it to the variant matrix, and to the Guidelines/decision-matrix section if the component has one
(Button and Input do).

## 5. Check the lint guard still makes sense

`packages/design-system/eslint/rules.cjs`. Two things to check:

- If the variant lets a call site stop overriding a utility, make sure the guard's message names the
  new prop value — the message is the only documentation a developer sees at the moment they break
  the rule.
- If you added a **new component** that owns geometry or colour, add a guard for it, plus a case in
  `eslint/rules.test.ts`. A guard with no test can silently stop matching; a component with no guard
  drifts freely.

## 6. Migrate the call sites you counted

The point of the variant is to remove the overrides that justified it. Replace them, and delete any
now-unnecessary `eslint-disable` comments — an unused directive is itself a lint warning, so leaving
them shows up.

## 7. Verify

```bash
yarn verify:ds        # the package: type-check, lint, prettier, tests
yarn verify:web       # both consumers see the change
```

Then look at the component in Storybook, in **both themes**:

```bash
yarn workspace @safe-global/design-system storybook
```

## Adding a whole primitive instead?

Use `/design-system.new-component`.
