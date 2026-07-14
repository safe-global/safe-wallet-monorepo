# MUI → shadcn Migration Playbook

The repeatable recipe for migrating a file/feature off `@mui/material` onto the shadcn/ui
design system (`@/components/ui`). Companion to the surface map in
[`SHADCN_MIGRATION_MAP.md`](./SHADCN_MIGRATION_MAP.md) and the plan in
`docs/superpowers/plans/2026-06-04-shadcn-migration.md`.

## Why incremental is safe

MUI's `<ThemeProvider>` and shadcn's `<ShadcnProvider>` coexist in `_app.tsx`. Both derive
their tokens from `@safe-global/theme` (`vars.css` → `globals.css`), so a screen that is
half-MUI / half-shadcn stays visually consistent. Migrate **whole features as slices** and
even **mixed within a file** — both are fine.

## Per-file recipe

1. **List the MUI imports:** `grep -n "@mui" <file>`.
2. **Map each component** using the table below.
3. **Layout primitives → Tailwind.** `Box`/`Stack`/`Grid`/`Paper`/`Container` become utility
   `<div>`s. Spacing: MUI `spacing(1)=8px=gap-2`, `(2)=16px=gap-4`, `(3)=24px=gap-6`,
   `(0.5)=4px=gap-1`. Never hard-code colors — use theme CSS vars / Tailwind tokens.
4. **Alias name clashes** during partial migration: `import { Typography as ShadcnTypography } from '@/components/ui/typography'`.
5. **Icons:** `SvgIcon component={X} inheritViewBox` → render the SVGR component directly
   (`<X className="size-4" />`). Note SVGR `<svg>` ignores MUI's `font-size` sizing — set
   `size-*` (Tailwind) or `width/height` (CSS). For currentColor SVGs, `text-[var(--color-NAME)]`
   colors them. Prefer `lucide-react` for generic icons (`X`, `ChevronDown`, …).
6. **Verify zero MUI:** `grep -n "@mui" <file>` → no output.
7. **Verify the change:** `yarn verify:changed:web` (or the manual checks below).
8. **Commit** with `refactor(<area>): migrate <component> to shadcn`.

## Component mapping

| MUI                                      | shadcn (`@/components/ui/…`)                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Typography`                             | `typography` — variants: `paragraph`, `paragraph-small`, `paragraph-small-bold`, `paragraph-mini`, `h1`–`h4`, `code`                    |
| `Button`, `IconButton`                   | `button` — `variant` (default/ghost/…), `size` (default/sm/lg/icon)                                                                     |
| `Tooltip`                                | `tooltip` — `<Tooltip><TooltipTrigger render={…}>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>` (provider is built in) |
| `Skeleton`                               | `skeleton` — size via `className="h-4 w-…"`                                                                                             |
| `Alert`                                  | `alert`                                                                                                                                 |
| `Card`                                   | `card`                                                                                                                                  |
| `Divider`                                | `separator`                                                                                                                             |
| `CircularProgress`                       | `spinner`                                                                                                                               |
| `Dialog`                                 | `dialog` / `sheet` / `drawer`                                                                                                           |
| `Accordion`                              | `accordion`                                                                                                                             |
| `Checkbox`/`Switch`/`Select`             | `checkbox` / `switch` / `select`                                                                                                        |
| `TextField`                              | `input` + `field` + `label`                                                                                                             |
| `Link`                                   | `link` ← **new**                                                                                                                        |
| `Chip`                                   | `chip` ← **new** (or `badge` for static pills)                                                                                          |
| `List`/`ListItem`/`ListItemText`         | `list` ← **new**                                                                                                                        |
| `Box`/`Stack`/`Grid`/`Paper`/`Container` | Tailwind utility `<div>`                                                                                                                |
| `useMediaQuery`/`useTheme`               | (open decision — see map §5)                                                                                                            |

## Manual verification (when `verify:changed` isn't used)

```bash
# Env note for this sandbox: HOME/overlay is read-only and /tmp is a 128M tmpfs.
# Point all writable paths at /workspace and give tsc a bigger heap.
export HOME=/workspace/.home COREPACK_HOME=/workspace/.home/corepack \
  TMPDIR=/workspace/.tmp YARN_ENABLE_GLOBAL_CACHE=0 \
  YARN_GLOBAL_FOLDER=/workspace/.yarn-global NODE_OPTIONS=--max-old-space-size=4096

yarn workspace @safe-global/web type-check                 # whole project (needs the heap bump)
npx prettier --write <changed files>
npx eslint <changed files>
yarn workspace @safe-global/web test <changed test files>
```

## Testing the migrated UI

Per the repo testing pyramid, **developer-owned tests come first**; Playwright is the top.

- **Component test (preferred):** props-driven components (e.g. `FeesPreview`) are tested with
  `render` from `@/tests/test-utils` — assert the migrated component renders the same content
  and states (loading / error / empty). See
  `apps/web/src/features/gtf/components/FeesPreview/index.test.tsx`.
- **Primitive test:** each new primitive (`link`/`chip`/`list`) ships unit tests + a Storybook
  story for visual review.
- **Playwright (visual, when the app is running):** boot the app/Storybook, then assert the
  migrated surface. Browser binaries need `PLAYWRIGHT_BROWSERS_PATH=/workspace/.pw-browsers`
  (the default `~/.cache` is read-only here) and network to download. Follow
  `apps/web/e2e/docs/AI_TEST_OUTPUT_FORMAT.md`. Capture before/after screenshots for the PR
  `## Visual summary`.

## Recommended order (from the map §4)

1. Lock conventions (this doc) + build any further missing primitives.
2. Migrate high-reuse `components/common` primitives.
3. Finish in-flight features: `spaces` (64), `myAccounts` (36).
4. Proceed feature-by-feature, smallest first; defer the heavy tx composites
   (`tx-flow` 58, `transactions` 59, `tx` 53, `new-safe` 23).
5. Tackle the heavy tx composites last.
6. Remove MUI providers from `_app.tsx` once the `@mui/material` import count hits zero.

## Burn-down tracking

```bash
# Remaining files importing MUI (target: 0)
grep -rl "@mui/material" apps/web/src --include="*.tsx" --include="*.ts" | wc -l

# Per-feature remaining
for d in apps/web/src/features/*/; do \
  echo "$(grep -rl '@mui/material' "$d" --include='*.tsx' --include='*.ts' | wc -l)  $(basename "$d")"; \
done | sort -rn

# Per-file zero-check before committing a slice
grep -rl "@mui" apps/web/src/features/<feature>   # expect: no output
```

**Optional guardrail:** add an ESLint `no-restricted-imports` rule warning on new
`@mui/material` imports in already-migrated paths, so the burn-down only goes down.

## Update (2026-06-08, branch `feat/shadcn-migration`)

- 🏁 **The finish line is cleared — every rendered production component is now MUI-free.**
  - ✅ Added the `calendar` primitive (react-day-picker v9) and migrated `DatePickerInput` off
    `@mui/x-date-pickers`; **dropped the `@mui/x-date-pickers` dependency** (package.json + lockfile).
  - ✅ Migrated the **NumberField money-movement cluster** in 3 green-tree batches:
    `ApprovalValueField` → Combobox, `TxNonce` → Combobox, then rewrote `NumberField` to a shadcn
    `Input`/`Field`/`InputGroup` component + migrated its consumers (TokenAmountInput, GasLimitInput,
    SetupNestedSafe, UpsertRecoveryFlowSettings; the rest were API-compatible).
  - ✅ Fixed a `<p>`/`<div>` hydration error (added `as` to `typography`) and a Base UI tabs
    `nativeButton` warning in `NavTabs`.
  - ✅ Migrated all **80 `*.stories.tsx`** off MUI (fan-out of 6 parallel subagents).
  - ✅ Migrated the **test mocks / story infra** (`MockContextProvider`, 4 `*.test.tsx` using MUI
    for wrappers) and removed the **MUI ThemeProvider bridge**: dropped `SafeThemeProvider` +
    the MUI `ThemeProvider`/`CssBaseline` from `_app` and the test render helpers
    (`test-utils`, `scenario-utils`); `safeTheme` now uses a local `PaletteMode` type.
- ✅ **Dependency drop complete — `@mui/material`, `@mui/icons-material`, and `@emotion/*` are
  removed from `package.json` + lockfile.** The last touchpoints: `SwapWidget` now reads the CoW
  palette straight from `@safe-global/theme` (`lightPalette`/`darkPalette`, same values) instead
  of `generateMuiTheme`; `dashboard/styled` emotion components → Tailwind; the emotion cache +
  SSR plumbing (`_app`/`_document`/`createEmotionCache`) removed; `safeTheme.ts`, `mui.d.ts` and
  the MUI augmentation deleted; storybook previews/decorators + `next.config` optimizePackageImports
  cleaned; dead `@mui` jest mocks + license rows removed.
- 🎉 **MUI + Emotion are GONE from `apps/web`** — zero `@mui`/`@emotion` references in source,
  config, and storybook (only gitignored `.next/` build artifacts remain). Verified by
  whole-project type-check (0), eslint (0 errors), and the full Jest suite (5658 passing; the only
  reds are environmental: ts-node sandbox perm, a worker OOM, and a TZ-sensitive test under TZ=UTC).
- ⚠️ **Needs `next build` + running-app + product verification before merge:** the `_document`/`_app`
  SSR change (emotion removal), the `CssBaseline` removal (Tailwind preflight now owns the baseline
  reset), and money-movement surfaces (DatePicker / approvals / nonce / gas / amounts) + SwapWidget.

## Status (2026-06-04, branch `feat/shadcn-migration`)

- ✅ Missing primitives built + tested: `link`, `chip`, `list`.
- ✅ Migrated to zero-MUI (33 features/areas, ~255 files), in 6 verified waves: `gtf`,
  `actions-tray`, `safe-overview`, `support-chat`, `ledger`, `portfolio`, `speedup`,
  `no-fee-campaign`, `stake`, `tx-notes`, `targeted-outreach`, `wallet`, `multichain`, `nfts`,
  `batching`, `proposers`, `spending-limits`, `earn`, `counterfactual`, `positions`, `welcome`,
  `notification-center`, `address-book`, `walletconnect`, `recovery`, `swap`, `safe-messages`,
  `balances`, `safe-shield`, `hypernative`, `dashboard`, `sidebar`, `settings`. Each wave
  verified by whole-project `type-check` (0 errors), `eslint` (0 errors), and the affected
  component/behavioral tests (1900+ green across the migrated areas).
- ✅ Test infra (`jest.setup.js`): jsdom polyfills for `PointerEvent`/pointer-capture (Base UI
  Checkbox/Select/Tooltip interactions) and `window.matchMedia` (the `useIsMobile` hook that
  replaces MUI `useMediaQuery`). Hover Base UI tooltips with `userEvent.hover`, not
  `fireEvent.mouseOver`.
- 📝 Colocated test updates that recur: replace MUI class assertions (`MuiButton-fullWidth`,
  `MuiIconButton-sizeSmall`, `MuiTypography-h5`) with the shadcn equivalent (`w-full`, `size-6`,
  `data-variant="h4"`) or a behavioral assertion. Base UI checkbox puts `role="checkbox"` on
  the testid element itself. **Base UI Accordion UNMOUNTS collapsed content** (MUI kept it
  hidden) — use `not.toBeInTheDocument()` / `findByText`, not `not.toBeVisible()`. Base UI
  `Select`/`Popover`/`Dialog` content is portal-rendered on open — query the trigger by testid
  or `role`, not `getByLabelText`. Snapshot tests must be regenerated (`-u`) after verifying
  only the DOM (not behavior) changed.
- 📉 Burn-down: **~13 source files** still import `@mui/*` (was 781) — ~85% of source migrated. The
  rest of the prior count was Storybook stories (separate job) and test files using `@mui` for mocks.
  ALL feature areas, ALL `components/common`, the entire transaction core, all pages, and the
  utility/type modules are done. The dead `ContextMenu` and `Mui` re-export shims were deleted. ALL feature
  areas, ALL `components/common`, AND the entire transaction core (`transactions`, `tx`, `tx-flow`)
  are migrated. Of the 130: only ~42 are non-test/story source; the rest are 83 Storybook stories
  (run in a separate job — regenerate snapshots there) and 7 test files using `@mui` for mocks.
- 🏁 **The finish line — exactly these remain, in order (recommended as one focused PR):**
  1. **NumberField group** (3 + ~9 consumers): `common/NumberField` is a MUI `TextField` wrapper with
     `_formatNumber` parsing, used by 9 forms plus the freeSolo Autocompletes in `TxNonce` and
     `ApprovalEditor/ApprovalValueField`. Build a shadcn numeric field (Input + `field`/`label`
     running `_formatNumber`) with a clean API and migrate the 9 consumers; rebuild the Autocomplete
     presets (Unlimited / recent nonces) with `@/components/ui/combobox`. **Money-movement
     (amounts/gas/nonce/approvals) — needs the running app + product review.** `react-day-picker` and
     `combobox` are already available.
  2. **`common/DatePickerInput`** (MUI-X): build a shadcn date picker (`react-day-picker` calendar in
     a `popover`) and migrate its 2 consumers (`CsvTxExportModal`, `TxFilterForm`). Add a
     `calendar.tsx` via `npx shadcn add calendar` or hand-build on react-day-picker.
  3. **Theme-bridge cutover (LAST):** once 1–2 land and `grep -rl @mui/material src` is zero for
     rendered components, migrate `tests/test-utils`/`scenario-utils`/`stories/mocks/MockContextProvider`
     off the MUI `ThemeProvider`, remove `SafeThemeProvider` + the `<ThemeProvider>` from
     `pages/_app.tsx`, delete `components/theme/*` (`safeTheme.ts`, `mui.d.ts`) and `definitions.d.ts`
     MUI augmentation, then drop the `@mui/*` dependencies from `package.json`. `pages/licenses.tsx`
     is a false positive (the string `@mui` appears in the rendered license list, not in imports). ALL feature
     areas + ALL `components/common` (leaf, infra, AND foundational: EthHashInfo, ModalDialog,
     EnhancedTable, Table, PageLayout, Header) are done. Added `keepMounted` forwarding to the shadcn
     `Dialog` (for Captcha's Turnstile container) and a `useMediaQuery`/`useIsBelowMd` hook. All feature
     areas + all `components/common` leaf AND most infra (copy/link/tooltip helpers, form inputs,
     ConnectWallet/CheckWallet, Footer/PageHeader, ChainIndicator, TxModalDialog) done. A full
     `yarn jest` run (620 suites) verified each shared-component wave; only stale consumer assertions
     failed (all fixed). `ExternalLink` dropped MUI style props (sx/fontWeight/variant) → consumers
     converted to Tailwind `className`. A full `yarn jest` run (620 suites) was
     used to verify the shared-component changes; the only failures were stale consumer assertions
     (now fixed) — no production regressions. Two real a11y regressions were caught and fixed in
     components (`CookieAndTermBanner` checkbox, safe-apps bookmark/delete buttons).
- 🔚 **Remaining = the highest-risk core, recommended as smaller reviewed PRs:**
  - **Transaction money-movement core (~152 files): `tx-flow`, `transactions`, `tx`** — the main
    remaining chunk. Highest-stakes (transaction building/signing/execution). Migrate in small
    reviewed batches with full-suite verification per batch.
  - `common/NumberField` — its public API is MUI `TextFieldProps`, consumed by ~8 still-MUI tx
    forms; migrate it together with those forms.
  - `common/ContextMenu` (the MUI Menu wrapper) and the `common/Mui` re-export shim — delete/replace
    once no consumer imports them.
  - `components/theme` (3): `SafeThemeProvider` is the MUI `<ThemeProvider>` bridge — migrate LAST,
    only once `@mui/material` import count is otherwise zero, then remove the provider from `_app.tsx`.
  - Transaction composites (~152): `tx-flow`, `transactions`, `tx` — money-movement flows.
  - `components/theme` (3): `SafeThemeProvider` is the MUI `<ThemeProvider>` bridge — migrate LAST,
    only once `@mui/material` import count is otherwise zero, then remove the provider from `_app.tsx`.

### shadcn-usage audit (done)

Confirmed the migration uses real shadcn components, not ad-hoc primitives:

- Every MUI component **with** a shadcn equivalent → the shadcn component is used (button, dialog,
  select, tooltip, alert, card, table, accordion, switch, checkbox, radio-group, popover, sheet,
  drawer, skeleton, separator, badge, avatar, spinner, progress, collapsible, input/field/label,
  input-group, typography).
- Layout primitives (`Box`/`Stack`/`Grid`/`Paper`/`Container`) → Tailwind utility `<div>`s. **This is
  the correct shadcn/Tailwind approach** — there is no Box/Stack/Grid component by design.
- Inputs/Selects/Textareas across all migrated areas are **100% shadcn** (no hand-rolled `<input>`/
  `<select>`/`<textarea>`).
- Context menus were converted from hand-rolled `<li role="menuitem">` (inside the legacy MUI
  `common/ContextMenu`) to the shadcn **`dropdown-menu`** component.
- Remaining hand-rolled `<button>`s are intentional: polymorphic `render={<button/>}` targets for
  shadcn `Link`/`Trigger`, clickable cards, or deliberate CSS-module icon buttons (sidebar) kept to
  avoid size conflicts — not shadcn gaps.
- New primitives built (`link`, `chip`, `list`) have **no** shadcn-core registry equivalent, so
  building them (following the cva + base-ui conventions) was correct. When a needed component IS in
  the registry, prefer `npx shadcn add <name>` over hand-building.
- ⚠️ Follow-ups flagged during migration:
  - `targeted-outreach/OutreachPopup`: the forced-light MUI `ThemeProvider` was removed; the
    component keeps a hardcoded light-gradient background, so verify dark-mode text contrast
    (scope to light tokens or tokenize the gradient).
  - Storyshot snapshots for migrated components (e.g. `NoFeeCampaignBanner`) change with the
    DOM and must be regenerated in the storyshot job (they are excluded from `yarn test`).
  - shadcn `Alert` has only `default`/`destructive`/`warning` — MUI `severity="info"`/`success`
    map to `default` (neutral), losing the blue/green tint. If those semantics matter, add
    `info`/`success` variants to `alert.tsx`.
  - `wallet/WalletPopover`: MUI `transitionDuration={0}` → shadcn popover uses its default
    ~100ms animation; cosmetic only.
  - Icon coloring via `text-[var(--color-NAME)]` assumes the SVG uses `fill="currentColor"`
    (true for the migrated icons; confirm visually for any new ones).
- ⏳ Remaining: 526 files, dominated by large/complex areas. Recommended next: remaining
  feature-isolated areas (`safe-apps` ~32, `new-safe` ~22), then finish in-flight `spaces`
  (~64) and `myAccounts` (~35), then `components/common` (~124, high reuse). **Defer the heavy
  transaction composites — `tx-flow` (~58), `transactions` (~59), `tx` (~53) — to carefully
  reviewed, individually-tested PRs**, since they touch money-movement flows. One slice per PR,
  following this playbook.

### Scaling note (proven this session)

The single-file/small features above were migrated in two parallel batches of subagents
(one feature per agent, each handed this playbook). Type-check is whole-project and
memory-heavy, so it was **batched once per wave** rather than per file. This is the
recommended way to scale: fan out per-feature agents, then run a single `type-check` +
`eslint` gate over the wave before committing.
