---
name: design-system.audit
description: Audit the web apps for design-system drift — hard-coded colours, styling className overrides, stale escape-hatch disables, undocumented variants and stories missing states. Use when asked to check UI consistency, find drift, review design-system health, clean up styling overrides, or before a design review.
argument-hint: '[optional path or component to scope the audit to]'
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Audit for design-system drift

Finds where the apps have stopped following `packages/design-system/AGENTS.md`. Output is a
prioritised report, not a blind sweep of edits — most findings are judgement calls about whether to
add a variant or accept a one-off.

Scope to a path if one was given; otherwise `apps/web/src` and `apps/web-tanstack/src`.

## 1. Escape hatches — the standing to-do list

Every sanctioned escape is a call site that wanted something the variants couldn't express. The ones
whose reason admits a variant is missing are the highest-value findings.

```bash
grep -rn 'no-restricted-syntax --' apps/web/src apps/web-tanstack/src | wc -l
grep -rn 'no-restricted-syntax --' apps/web/src apps/web-tanstack/src | grep -iE 'pending|todo|no token|bespoke|grandfathered'
```

Group them by primitive. **Three or more escapes on the same primitive for the same reason is a
missing variant** — report it as one finding with the call sites listed, and point at
`/design-system.add-variant`.

Also flag escapes with **no reason after `--`**, and escapes on a **closed preset** (those have no
escape by design — the preset needs a prop).

## 2. Hard-coded colours

A hex or a stock Tailwind palette colour is invisible to the theme switch and to every future palette
change.

```bash
# Arbitrary colour values in class names
grep -rnE '(bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]' apps/web/src apps/web-tanstack/src
# Stock Tailwind palette instead of semantic tokens
grep -rnE '(bg|text|border)-(gray|slate|zinc|neutral|stone|red|green|blue|yellow|amber|orange)-[0-9]{2,3}' apps/web/src apps/web-tanstack/src
# Raw hex in CSS modules and inline styles
grep -rnE '#[0-9a-fA-F]{6}\b' apps/web/src --include='*.module.css' --include='*.tsx'
```

Expected exceptions: brand illustration fills in `globals.css`, and `--color-*` references (those are
tokens). Map each finding to the token it should use — `bg-muted`, `text-muted-foreground`,
`border-border`, the status `subtle`/`muted`/`strong` sets.

Report `border-input` separately and prominently: `--input` is the field **fill**, not a border
colour, so it is always wrong as an edge. The fix is `border-border`.

## 3. Styling className that lint can't see

The guards match literals, including inside `cn(...)`, but they cannot follow a class list through a
variable or a CSS module.

```bash
# Class strings assembled in a const then spread onto a primitive
grep -rnE "^const [A-Z_]+ = ('|\")[^'\"]*(h-|p-|bg-|rounded-|border)" apps/web/src
# CSS modules on files that also import design-system components
for f in $(grep -rl "styles.module.css" apps/web/src --include='*.tsx'); do
  grep -q "@safe-global/design-system" "$f" && echo "$f"
done
```

A CSS module that restyles a design-system component is drift the guards will never catch. Report it;
the fix is Tailwind utilities + `cn()`, or a variant.

## 4. Presets not being used

Hand-rolled versions of things a preset already owns.

```bash
# Cancel/Confirm footers built by hand instead of DialogActions
grep -rn -A6 '<DialogFooter' apps/web/src --include='*.tsx' | grep -c '<Button'
# Submit + spinner built by hand instead of SubmitButton
grep -rnE '<Button[^>]*type="submit"' apps/web/src --include='*.tsx'
# Magic min-widths that `size="submit"` exists to remove
grep -rnE 'min-w-\[[0-9]+' apps/web/src --include='*.tsx'
```

## 5. Coverage gaps in the design system itself

```bash
# Primitives with no story
for f in packages/design-system/src/components/*.tsx; do
  n=$(basename "$f" .tsx); case "$n" in *.test) continue;; esac
  [ -f "packages/design-system/src/stories/$n.stories.tsx" ] || echo "no story: $n"
done
# Primitives with no colocated test
for f in packages/design-system/src/components/*.tsx; do
  n=$(basename "$f" .tsx); case "$n" in *.test) continue;; esac
  [ -f "packages/design-system/src/components/$n.test.tsx" ] || echo "no test: $n"
done
# cva variant values with no explanatory comment — undocumented variants get misused
grep -rn -B1 "^      [a-z-]*:" packages/design-system/src/components/*.tsx | grep -v '//' | head -30
```

Also check the guard coverage: a primitive that owns geometry or colour but has no entry in
`packages/design-system/eslint/rules.cjs` can be overridden freely.

```bash
grep -oE "name\.name='[A-Za-z]+'" packages/design-system/eslint/rules.cjs | sort -u | wc -l
```

## 6. Confirm the enforcement is actually running

The failure mode here is silent, so verify rather than assume:

```bash
yarn workspace @safe-global/design-system test eslint   # each guard still fires
yarn workspace @safe-global/design-system test src/styles  # tokens resolve in both themes
```

## Report format

Group by severity, and for each finding give the file:line, the rule it breaks, and the concrete fix:

```
### Missing variants (N findings)
- Button: 4 escapes all asking for a compact toolbar height
  apps/web/src/…:120, …:88, …:301, …:415
  → add a `toolbar` size (/design-system.add-variant)

### Hard-coded colours (N findings)
- apps/web/src/…/Foo.tsx:42  bg-[#f5f5f5]  → bg-muted
- apps/web/src/…/Bar.tsx:17  border-input  → border-border (--input is the field fill)

### Invisible to lint (N findings)
- apps/web/src/…/styles.module.css restyles <Card> → use `size`/`variant`

### Design-system gaps (N findings)
- kbd, empty: no story
- combobox: 6 variant values, none commented
```

Don't apply fixes unless asked. Where a fix is a shared-variant change, say so — that is an app-wide
decision and belongs in a design review, not a cleanup commit.
