# MUI → shadcn Migration Contract

> The rules an agent MUST follow when migrating files in `apps/web` off `@mui/material` onto
> the shadcn/ui design system (`@/components/ui`). These rules ARE the design-system contract.
>
> **Use as a `/goal`:** the full text exceeds the `/goal` 4000-char limit, so set a short goal
> that points here, e.g. _"Follow apps/web/docs/SHADCN_MIGRATION_CONTRACT.md to migrate
> &lt;files&gt; off MUI to shadcn."_
>
> Companion docs: [`SHADCN_MIGRATION_PLAYBOOK.md`](./SHADCN_MIGRATION_PLAYBOOK.md) (per-file
> recipe), [`SHADCN_MIGRATION_MAP.md`](./SHADCN_MIGRATION_MAP.md) (surface map),
> [`../AGENTS.md`](../AGENTS.md), [`../.storybook/AGENTS.md`](../.storybook/AGENTS.md), and the
> `design.*` skills (figma-to-code, sync-component, verify).

## Non-negotiable design-system rules

1. **NEVER hard-code colors, spacing, radii, or font sizes.** Use theme CSS vars from
   `vars.css` / Tailwind tokens. `vars.css` is AUTO-GENERATED from `@safe-global/theme` —
   never edit it; if a token is missing, edit `packages/theme` and run
   `yarn workspace @safe-global/web css-vars`.
2. **Text ALWAYS goes through the `typography` component** variants (`paragraph`,
   `paragraph-small`, `paragraph-small-bold`, `paragraph-mini`, `h1`–`h4`, `code`) — never raw
   Tailwind font classes for text styling.
3. **Tailwind is for LAYOUT ONLY** (`flex`, `grid`, `gap-*`, `p-*`, `w-full`, `size-*`).
   Spacing mapping: MUI `spacing(1)=8px=gap-2`, `(2)=16px=gap-4`, `(3)=24px=gap-6`,
   `(0.5)=4px=gap-1`.
4. **Use the REAL shadcn component** for any MUI component that has an equivalent — do not
   hand-roll `<input>`/`<select>`/`<textarea>`/`<button>` or ad-hoc primitives. Mapping table:

   | MUI                                              | shadcn                                 |
   | ------------------------------------------------ | -------------------------------------- |
   | `Typography`                                     | `typography`                           |
   | `Button` / `IconButton`                          | `button` (variant/size, `size="icon"`) |
   | `Tooltip`                                        | `tooltip`                              |
   | `Skeleton`                                       | `skeleton`                             |
   | `Alert`                                          | `alert`                                |
   | `Card`                                           | `card`                                 |
   | `Divider`                                        | `separator`                            |
   | `CircularProgress`                               | `spinner`                              |
   | `Dialog`                                         | `dialog` / `sheet` / `drawer`          |
   | `Accordion`                                      | `accordion`                            |
   | `Checkbox` / `Switch` / `Select`                 | `checkbox` / `switch` / `select`       |
   | `TextField`                                      | `input` + `field` + `label`            |
   | `Link`                                           | `link`                                 |
   | `Chip`                                           | `chip` (or `badge` for static pills)   |
   | `List` / `ListItem`                              | `list`                                 |
   | `Menu` / `ContextMenu`                           | `dropdown-menu`                        |
   | `Box` / `Stack` / `Grid` / `Paper` / `Container` | Tailwind `<div>`                       |

5. **Prefer the registry.** If a needed component IS in the shadcn registry, prefer
   `npx shadcn add <name>` over hand-building. Only hand-build (cva + base-ui conventions) when
   there is no registry equivalent.
6. **Use sentence case** for all UI copy ("Add new owner", not "Add New Owner").
7. **Icons:** render SVGR components directly (`<X className="size-4" />`) or prefer
   `lucide-react` for generic icons. SVGR `<svg>` ignores MUI `font-size` — size with `size-*`
   or width/height. Color `currentColor` SVGs via `text-[var(--color-NAME)]`.

## Per-file recipe

1. `grep -n "@mui" <file>` to list every MUI import.
2. Map each one via the table. Alias clashes during partial migration:
   `import { Typography as ShadcnTypography } from '@/components/ui/typography'`.
3. Migrate. Mixed MUI/shadcn within a file is fine mid-migration (both providers coexist).
4. Verify ZERO MUI left: `grep -n "@mui" <file>` → no output.
5. **Update colocated tests:** replace MUI class assertions (`MuiButton-fullWidth`,
   `MuiTypography-h5`, `MuiIconButton-sizeSmall`) with shadcn equivalents (`w-full`,
   `data-variant="h4"`, `size-6`) or behavioral assertions. Watch these Base UI gotchas:
   - Accordion UNMOUNTS collapsed content → use `not.toBeInTheDocument()` / `findByText`, not
     `not.toBeVisible()`.
   - Select/Popover/Dialog content is portal-rendered on open → query trigger by testid or
     role, not `getByLabelText`.
   - Checkbox puts `role="checkbox"` on the testid element itself.
   - Hover tooltips with `userEvent.hover`, not `fireEvent.mouseOver`.
   - Regenerate snapshots (`-u`) only after confirming the DOM (not behavior) changed.
6. **Every new/changed component needs a Storybook story** (light + dark are auto-captured by
   Chromatic). Page/widget stories use `createMockStory`; Redux-only components use
   `withMockProvider()`; simple components use a plain story.
7. Run the gate (below). Commit: `refactor(<area>): migrate <component> to shadcn`.

## Verification gate (must be clean before committing)

- `yarn workspace @safe-global/web type-check` (whole-project, run once per wave)
- `yarn workspace @safe-global/web lint` on changed files
- `yarn workspace @safe-global/web prettier` (CI rejects unformatted code; run `prettier:fix` first)
- `yarn workspace @safe-global/web test <changed test files>`
- Or just: `yarn verify:changed:web`

## Before you start each file, produce the regression checklist

Per root `AGENTS.md`: map the surface (shared hook/component/selector/slice/endpoint/flag),
find consumers with LSP `findReferences` (not grep), translate into user flows, list tests to
add/run, and state what you will NOT verify. Shared `components/common` primitives have many
consumers — slow down there.

## Money-movement = highest risk

`tx-flow`, `transactions`, `tx`, `NumberField`, and approval/nonce/gas fields touch
transaction building/signing/execution. Migrate these in SMALL reviewed batches with
full-suite verification, never in a big sweep, and flag for product review + running-app
verification.

## Report back per file

- MUI imports removed (and grep proof of zero).
- shadcn components used + any token gaps you had to add to `packages/theme`.
- Tests updated/added and gate result.
- Any intentional visual deltas or follow-ups (e.g. Alert info/success → neutral, dark-mode
  contrast, animation timing) — list them explicitly rather than hiding them.
