---
name: design.audit-shadcn
description: Audit Safe Wallet shadcn/ui usage for design-system breaches. Use when reviewing feature code for custom styling that bypasses component variants, sizes, or state styling, and when producing a markdown breach table with fixes.
argument-hint: '[feature-path-or-branch]'
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# shadcn Design-System Audit

Audit **$ARGUMENTS** for cases where feature code treats shadcn primitives like raw HTML instead of using the component API.

## What counts as a breach

Flag high-confidence cases where feature code overrides visual intent that should come from `variant`, `size`, or component-owned state styles:

- `Button`, `Badge`, `SidebarMenuButton`, `SelectTrigger`, `Avatar`, `Typography`
- `className` changing `bg-*`, `text-*`, `border-*`, `rounded-*`, `h-*`, `px-*`, `py-*`
- `hover:*`, `data-*`, or `!important` overrides that fight primitive state styling
- Typography weight/leading/tracking overrides that effectively create a hidden new text variant

Do not flag pure layout hooks:

- `truncate`, flex/grid placement, width constraints, wrappers, spacing around the component

## Audit workflow

1. Read the component contracts first:
   - `apps/web/src/components/ui/button.tsx`
   - `apps/web/src/components/ui/sidebar.tsx`
   - `apps/web/src/components/ui/avatar.tsx`
   - `apps/web/src/components/ui/select.tsx`
   - `apps/web/src/components/ui/typography.tsx`
2. Run the helper:

```bash
./.claude/skills/design.audit-shadcn/scripts/find_shadcn_breaches.sh
```

3. Open the strongest candidates and keep only high-confidence breaches.
4. Group repeated patterns under a few root causes instead of listing every cosmetic class.

## Required output

Always produce:

1. Three meeting points:
   - primitives used like raw HTML
   - state styling overridden from feature CSS
   - repeated escape hatches showing a missing variant/wrapper
2. A markdown table with:
   - `File`
   - `Usage example`
   - `Why this breaks the contract`
   - `Better approach`

## Output guidance

- Prefer exact file references and short usage snippets.
- Tie each finding back to the primitive contract.
- Recommend adding a variant, size, or wrapper when the same override repeats.
- Use `references/epicspaces-m2-2026-04-22.md` as a concrete example of the expected audit format and level of specificity.
