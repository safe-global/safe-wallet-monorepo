# shadcn Migration — Open Issues Log

Running list of visual / behavioral issues found while QA-ing the MUI → shadcn migration.
Each entry is self-contained so a migration agent can pick it up cold. Fix one, verify per
`SHADCN_MIGRATION_PLAYBOOK.md` (no hard-coded values, theme tokens only, story + tests, clean
`yarn verify:changed:web`), then check it off.

**Status legend:** 🔴 open · 🟡 in progress · ✅ done · 🔵 verify (likely not a bug — confirm before acting)

---

## Resolution summary (2026-06-09)

All issues triaged and addressed on `feat/shadcn-migration`. Verified with `tsc` type-check
(pass), prettier (pass), and the unit-test suites for every changed area (69 tests pass). SVG
asset fixes are mocked in jest so they don't affect snapshots.

**Code-fixed:** 001, 002, 003, 005, 006, 007, 008, 010, 011, 012, 013, 014.
**Verified — not a bug (no code change):** 009 (font is a single shared DM Sans family).
**Verified — confirmed defect is dead code; live header already consistent:** 004.
**Deferred polish (🔵, compare per-surface against prod):** 012b.

⚠️ **Visual confirmation not performed in this environment.** The repo's Storybook
snapshot suite is independently stale on this branch (committed `.snap` files still contain
pre-migration MUI markup such as `MuiPaper-root` / `mui-style-*`, so they fail branch-wide for
components untouched here) — it could not be used as a signal. Each fix below restores an exact
pre-migration value, a confirmed in-repo convention, or a verified theme token; the residual
risk is light/dark/mobile pixel confirmation, noted per issue.

---

## ISSUE-001 — Address book: title & action buttons not aligned with the page content ✅

**Resolution:** Added `px-4` to the `AddressBookHeader` root (`AddressBookHeader/index.tsx:60`)
so the title/buttons/search share the card's inner-content left edge (the card uses `p-4`). Both
header and card already share the page inset from `PageLayout` `.content main` (`var(--space-3)`);
the only mismatch was the card's internal `p-4`. _Residual: confirm title aligns with Name/Address
columns in light/dark._

**Route:** `/address-book?safe=eth:0xCB935332e939079929b7bBd8C805017eF1A840b6`
**Area:** `components/address-book`

**Symptom (from screenshot):** The page title ("Address book") and the action buttons
(New entry / Import / Export / Search) sit flush against the page's left content edge, but the
content card below — and the table columns inside it ("Name" / "Address") — are horizontally
offset. The header and the card/table content do not line up on a shared left margin, so the
page looks misaligned.

**Root cause (suspected):**

- The header is rendered in a plain flex div with **no horizontal padding**:
  `AddressBookHeader/index.tsx:60` → `<div className="mb-6 flex flex-col gap-6">`.
- The content below wraps the table in a card with `p-4`:
  `AddressBookTable/index.tsx:186` → `<div className="bg-card mb-4 rounded-lg border p-4">`.
- So the header content is flush-left while the card's inner content is inset by the card
  padding (~16px), breaking vertical alignment between the title/buttons and the table columns.
- Likely a regression from replacing MUI's `PageHeader` / Grid container spacing with raw
  Tailwind divs during migration.

**Files:**

- `apps/web/src/components/address-book/AddressBookHeader/index.tsx`
- `apps/web/src/components/address-book/AddressBookTable/index.tsx`
- `apps/web/src/components/address-book/AddressBookTable/styles.module.css`

**Suggested direction (confirm against the design system, don't hard-code):**

- Decide on one consistent left content edge for the page and make the header, the card, and
  the table share it. Either give the header the same horizontal inset as the card content, or
  align the card so its inner content lines up with the header — match whatever the design /
  other migrated pages (e.g. dashboard, settings) use for page-header → content alignment.
- Cross-check against a non-migrated reference or the Figma source so the corrected spacing
  uses theme spacing tokens, not arbitrary px.

**Verify:** Visually confirm title, buttons, and the "Name"/"Address" columns share a left
edge in both light and dark; re-run the address-book stories / component tests.

---

## ISSUE-002 — Address book: "Import" button icon is invisible ✅

**Resolution:** Added `fill="currentColor"` to both paths in `import.svg`. Fixed as part of the
ISSUE-012 single-color icon sweep. Root cause confirmed: SVG identical to `dev`; migrated consumer
dropped MUI's `SvgIcon` (which supplied `fill: currentColor`) for a bare SVGR import.

**Route:** `/address-book?safe=eth:0xCB935332e939079929b7bBd8C805017eF1A840b6`
**Area:** `components/address-book` (icon asset)

**Symptom (from screenshot):** The "Import" button shows only its label — no icon — while the
adjacent "Export" button correctly shows its arrow icon. Both are rendered the same way in
`AddressBookHeader/index.tsx` (`<ImportIcon className="size-4" />` / `<ExportIcon ... />`).

**Root cause (confirmed):** The icon SVGs declare `fill="none"` on the root `<svg>`, which
cascades to child `<path>`s. In `export.svg` each path overrides this with
`fill="currentColor"`, so it inherits the button's text color and is visible. In `import.svg`
the paths have **no `fill` attribute**, so they inherit `fill="none"` and render invisible.
The `size-4` class only sizes the SVG; it cannot supply a fill. (Matches the playbook note:
currentColor SVGs are colored via the text color — but only if the path actually uses
`currentColor`.)

**Files:**

- `apps/web/public/images/common/import.svg` ← the broken asset (paths missing fill)
- `apps/web/public/images/common/export.svg` ← reference (paths use `fill="currentColor"`)
- `apps/web/src/components/address-book/AddressBookHeader/index.tsx:77` ← consumer

**Fix:** Add `fill="currentColor"` to both `<path>` elements in `import.svg` (mirroring
`export.svg`). Do **not** add a hard-coded color — `currentColor` lets it inherit the button's
text token. After the fix, confirm the icon is visible on the outline button in both light and
dark, and check other consumers of `import.svg` (search references) so the change doesn't
regress anywhere that relied on the prior behavior.

**Note:** This is a shared asset, not component code — worth a quick check for other broken
icons with the same `fill="none"` + no-path-fill pattern in `public/images/` (see ISSUE-012).

**Confirmed additional occurrences (same `import.svg`, fixed by the same change):**

- Address book header "Import" button (original report).
- Settings "Export or import your Safe data" panel — the "Import" button is blank while
  "Export" shows its arrow. Same root cause; no separate fix needed.

---

## ISSUE-003 — Transaction History/Queue: row hover background is invisible (lost the green hover) ✅

**Resolution:** In `TxListItem/styles.module.css`, restored the Safe accent tokens on
`.listItem:hover/.batched/[data-open]` — `background-color: var(--color-secondary-background)` +
`border-color: var(--color-secondary-light)` — and the trigger hover to
`var(--color-background-light)` (exact pre-migration values). Also gave `.listItem` a
`1px solid transparent` border (was `border: none`) so the green outline renders on hover with no
layout shift, mirroring `dev`'s `border-color: transparent` default. _Residual: confirm green
bg+border on History/Queue rows, light/dark; nested rows stay transparent by design._

**Route:** Transactions → History and Queue lists (e.g. `/transactions/history?safe=...`)
**Area:** `components/transactions/TxListItem`

**Symptom (from screenshot):** Hovering a transaction row sets its background to the same
color as the parent surface, so the hover state is effectively invisible / looks broken. On
production the row hover shows a light **green background + green outline** (the Safe accent
hover state).

**Root cause (confirmed):** The hover CSS was migrated to shadcn's generic tokens, which equal
the surface color, instead of Safe's green accent tokens. In
`TxListItem/styles.module.css`:

- The row's default background is `var(--card)` (line 5).
- The `:hover` rule **also** sets `background-color: var(--card)` (lines 26–30) → identical to
  default, so no visible change. It also no longer sets any `border-color`, so the green
  outline is gone.
- The trigger hover uses `var(--muted)` (lines 32–35) — a faint gray, not the green accent.

Introduced during the MUI→shadcn migration (commit `1aa7b6d49`), which swapped Safe's semantic
tokens (`--color-secondary-background`, `--color-secondary-light`, `--color-background-light`)
for shadcn defaults (`--card`, `--muted`).

**Correct (pre-migration) values, to restore:**

- Row hover/`.batched`/`[data-open]`: `background-color: var(--color-secondary-background)`
  **and** `border-color: var(--color-secondary-light)` (the green outline).
- Trigger hover: `background-color: var(--color-background-light)`.

These tokens resolve to the green accent in both themes (light `#effff4` bg / `#b0ffc9` border;
dark `#1b2a22` bg) — verified in `vars.css` and `packages/theme/src/palettes/{light,dark}.ts`.

**Reference (a list that still hovers green correctly):**
`apps/web/src/components/sidebar/SidebarList/styles.module.css:28-30` uses
`background-color: var(--color-background-light)`.

**File to fix (single file):**

- `apps/web/src/components/transactions/TxListItem/styles.module.css` (lines 26–35)
- Component (no change expected): `TxListItem/ExpandableTransactionItem.tsx` (already on shadcn
  `@/components/ui/accordion`).

**Verify:** Hover a History and a Queue row in both light and dark — expect green background +
green border. Check the nested-row case (`.listItemNested`, lines 15–20 stay transparent by
design) and the expanded `[data-open]` state. Low risk: CSS-module only, no logic change — but
it lives in the high-risk tx area, so run the transactions component/snapshot tests after.

---

## ISSUE-004 — Header: top-right icon buttons have inconsistent padding / icon centering vs prod 🔵

**Resolution (investigated — no code change):** The one _confirmed_ defect, the
`.bell { padding: 10px }` override, lives in `components/common/Header/index.tsx`, which is marked
`@deprecated Legacy MUI Header component, replaced by TopBar` and is **not** rendered in the shipped
top bar. The live header (`Topbar` → `features/spaces/.../HeaderNavigation`) already standardizes
search/bell/batch to `size="icon-sm"` + `m-1` with `size-5` icons; only the wallet pill uses
`size="sm"` (a text pill, expected). I did not blind-edit the shipped header. _Residual: the broader
"off-center vs prod" claim needs a live side-by-side — re-open with a specific button if confirmed._

**Route:** Any page — the global top bar (e.g. `/home?safe=...`)
**Area:** `common/Header/Topbar` + `features/spaces/components/HeaderNavigation` + `notification-center`

**Symptom (from screenshots):** The row of header action buttons (tx counter, search, bell,
batch/stack, Connect Wallet) have different padding / the icons sit off-center compared to
production, where each pill button has consistent padding and a centered icon.

**Root cause (suspected — confirm visually against prod):** The buttons were migrated to shadcn
`@/components/ui/button` but with inconsistent size variants and a leftover hardcoded padding
override:

- `HeaderNavigation.tsx`: search / bell / batch buttons use `size="icon-sm"` (32px) with an
  extra `m-1` margin, while the **wallet** button uses `size="sm"` (36px, `px-4`) and the
  **menu** button in `Topbar/index.tsx` uses `size="icon"` (36px). Mixed button heights in one
  row → uneven look.
- `notification-center/NotificationCenter/styles.module.css` has a hardcoded
  `.bell { padding: 10px }` that overrides the shadcn button's centered padding for the bell
  icon specifically — a prime suspect for the off-center icon.
- All icons are `size-5` (20px) but sit inside differently-sized buttons, so optical centering
  drifts.

**Files:**

- `apps/web/src/features/spaces/components/HeaderNavigation/HeaderNavigation.tsx` (search/bell/batch/wallet buttons)
- `apps/web/src/components/common/Header/Topbar/index.tsx` (menu button, container wrappers)
- `apps/web/src/components/notification-center/NotificationCenter/styles.module.css` (hardcoded `.bell` padding)
- Reference: `apps/web/src/components/ui/button.tsx` (size variants: `icon-sm`=32, `icon`=36, `sm`=36)

**Suggested direction (don't hard-code px):** Standardize all the icon-only header buttons to a
single size variant (e.g. `icon-sm`) with no ad-hoc `m-1`, remove the
`.bell { padding: 10px }` override so the shadcn button centers the icon, and confirm the
wallet pill height matches the icon buttons' visual box. Compare side-by-side with prod.

**Verify:** All header buttons share the same height and centered icons in light + dark, at
desktop and the mobile breakpoint; the notification badge still positions correctly.

---

## ISSUE-005 — Safe Apps page: no vertical space between "My pinned apps" and the list below ✅

**Resolution:** Restored the exact pre-migration (`dev`) spacing. Header
(`SafeAppsListHeader/index.tsx`): `mt-[var(--space-3)] mb-[var(--space-2)]` (was `mt/mb-[var(--space-4)]`;
`dev` MUI was `mt:3 mb:2` = 24/16px). Grid (`SafeAppList/styles.module.css`):
`grid-gap: var(--space-3)` + `padding: 0 0 var(--space-1)` (was `--space-4` for both; `dev` was
`--space-3` / `--space-1`). _Residual: confirm even rhythm pinned→featured→all in the running app._

**Route:** `/apps?safe=...` ("Explore the Ethereum ecosystem")
**Area:** `components/safe-apps`

**Symptom (from screenshot):** The "My pinned apps" section and the "Featured apps" / list
section below run together without the section spacing present on production.

**Root cause:** Section spacing is driven by two knobs that changed during migration, and the
page (`pages/apps/index.tsx:68-94`) stacks `<SafeAppList>` sections with no wrapper gap — each
section supplies its own margins:

- `SafeAppsListHeader/index.tsx:10-13` — header uses `mt-[var(--space-4)] mb-[var(--space-4)]`
  (32px/32px). Pre-migration this was ~`mt:3` (24px) with no explicit bottom.
- `SafeAppList/styles.module.css:5` — grid `padding: 0 0 var(--space-4)` (32px bottom);
  pre-migration was `var(--space-1)` (8px).

The net inter-section gap no longer matches prod (the two values were retuned independently
during migration). Decide the intended gap once and apply it consistently between sections.

**Files:**

- `apps/web/src/components/safe-apps/SafeAppsListHeader/index.tsx`
- `apps/web/src/components/safe-apps/SafeAppList/styles.module.css`
- `apps/web/src/pages/apps/index.tsx` (section stacking, lines 68-94)

**Suggested direction:** Compare against prod and set a single consistent section rhythm using
theme spacing tokens (`var(--space-*)`), rather than the two competing margin/padding values.
Verify the gap between My pinned apps → Featured apps → All apps is even.

---

## ISSUE-006 — Safe Apps page: Search input and Category dropdown have different heights ✅

**Resolution:** Set `height: var(--space-5)` (40px = the SearchField's `h-10`) on `.fieldControl`
in `SafeAppsFilters/styles.module.css`. A plain `h-10` couldn't win against the trigger's
`data-[size=default]:h-9` (higher specificity), but the CSS-module rule reliably overrides the
Tailwind utility (same mechanism as the existing border/bg overrides there). SearchField (shared)
left untouched. _Residual: confirm equal height in the filter row, desktop + mobile, light/dark._

**Route:** `/apps?safe=...`
**Area:** `components/safe-apps/SafeAppsFilters`

**Symptom (from screenshot):** The "Search" input and the "Category" select are not the same
height, so the filter row looks misaligned (the row uses `items-end`, so the mismatch shows).

**Root cause (confirmed):** The two controls use different shadcn height classes:

- Search uses `SearchField`, whose input is hardcoded to `h-10` (40px) —
  `common/SearchField/index.tsx:12-13`.
- The category `SelectTrigger` uses the shadcn default size `h-9` (36px) —
  `ui/select.tsx`; the `filterFieldClassName` applied to it (`SafeAppsFilters/styles.module.css`
  `.fieldControl`) only sets border/background, **no height**.

So 40px vs 36px → 4px mismatch.

**Files:**

- `apps/web/src/components/common/SearchField/index.tsx:12-13` (input `h-10`)
- `apps/web/src/components/safe-apps/SafeAppsFilters/index.tsx:45-72` (SearchField + SelectTrigger usage)
- `apps/web/src/components/safe-apps/SafeAppsFilters/styles.module.css` (`.fieldControl`, no height)
- Reference: `apps/web/src/components/ui/select.tsx` (default trigger `h-9`)

**Suggested direction:** Make both controls the same height. Either set the SelectTrigger to
`h-10` (e.g. via `filterFieldClassName`) to match the search input, or align both to the
design-system default — but they must match. **Note `SearchField` is shared** (LSP
findReferences before changing its `h-10`); prefer adjusting the local Select height here so
other SearchField consumers aren't affected.

**Verify:** Search and Category line up at equal height in the filter row (desktop + mobile
stacked), light + dark.

---

## ISSUE-007 — Promo banner (EURCV / earn): close (X) button is mispositioned ✅

**Resolution:** Rewrote `.closeButton` in `PromoBanner/styles.module.css` as a centered flex box
(`display: inline-flex; align-items: center; justify-content: center`) with symmetric
`padding: var(--space-1)`; removed the undersized fixed `16px` box and the asymmetric
`padding-top: 12px`. The `size-6` icon now centers in the top-right corner (top/right kept at
`var(--space-2)`). Shared component — affects EURCV + Hypernative banners. _Residual: confirm X
centered top-right on all PromoBanner consumers, light/dark, desktop + mobile._

**Route:** Dashboard news carousel — EURCV boost banner (also affects any `PromoBanner` user)
**Area:** `components/common/PromoBanner` (shared)

**Symptom (from screenshot):** The X close button on the green "EURCV is now available" promo
banner is positioned wrong — the icon isn't sitting where the button box should be (off-center
/ overflowing its hit area).

**Root cause (confirmed):** In `PromoBanner/styles.module.css`, `.closeButton` (lines 61-69) is
absolutely positioned but sized smaller than its icon and has no centering:

```css
.closeButton {
  position: absolute !important;
  top: var(--space-2);
  right: var(--space-2);
  padding: 10px;
  padding-top: 12px; /* asymmetric */
  width: 16px;
  height: 16px;
  /* no display:flex / align-items / justify-content */
}
```

The icon is rendered at `size-6` (24px) — `<CloseIcon className="size-6 ..." />` in
`PromoBanner.tsx:182-192` — which is larger than the 16px button box. With the asymmetric
padding and no flex centering, the 24px icon overflows and renders off-position. (Migration
swapped the MUI IconButton for a native `<button>` + lucide `X`, but the CSS box wasn't sized
to match the new icon.)

**Files:**

- `apps/web/src/components/common/PromoBanner/styles.module.css:61-85` (`.closeButton`, `.closeIcon`)
- `apps/web/src/components/common/PromoBanner/PromoBanner.tsx:182-192` (close button JSX, `size-6` icon)
- Consumers (verify after fix — shared component): `dashboard/NewsCarousel/banners/EurcvBoostBanner.tsx`,
  `features/hypernative/components/HnBanner/HnBanner.tsx`

**Suggested direction (don't hard-code odd px):** Make `.closeButton` a flex box that centers
its icon (`display:flex; align-items:center; justify-content:center`) and size the box to the
icon (e.g. a consistent `size-*`/padding pair), with symmetric padding. Align `top/right` with
theme spacing tokens so the X is centered in the banner's top-right corner. Confirm against the
production banner. **This is a shared `PromoBanner`** — fix it once and re-check every consumer
banner (EURCV + Hypernative + any others) in light + dark and at the mobile breakpoint
(`@media (max-width: 599.95px)`, lines 110+).

**Verify:** X is centered in its hit area and correctly placed top-right on all PromoBanner
consumers, both themes, desktop + mobile.

---

## ISSUE-008 — Dashboard "Top positions": expand chevron not vertically centered ✅

**Resolution:** Added `items-center` to the `AccordionTrigger` className in
`PositionsWidget/index.tsx` (local fix only — the shared `ui/accordion.tsx` `items-start` default
was intentionally left untouched so multi-line accordions like the tx rows don't regress). The row
content is single-line, so centering is safe. _Residual: confirm chevron centered, collapsed +
expanded._

**Route:** Dashboard — "Top positions" widget (`/home?safe=...`)
**Area:** `features/positions/components/PositionsWidget`

**Symptom (from screenshot):** The chevron (expand/collapse) at the far right of a position row
(e.g. "Kiln 100.00% … $245.38") sits too high — not vertically centered with the row's token
icon, name, and value.

**Root cause (confirmed):** The shared shadcn `AccordionTrigger` aligns its direct children
with `items-start` (`ui/accordion.tsx:46`). The chevron (`ChevronDownIcon`/`ChevronUpIcon`,
lines 52-59) is a direct child of the trigger, so it pins to the **top**. But the row content
(`PositionsHeader/index.tsx:16`) is its own flex row with `items-center`, so the icon/name/value
are vertically centered. Result: centered content, top-aligned chevron → the chevron looks too
high.

**Files:**

- `apps/web/src/features/positions/components/PositionsWidget/index.tsx:138-143` (AccordionTrigger usage)
- `apps/web/src/features/positions/components/PositionsHeader/index.tsx:16` (`items-center` row)
- `apps/web/src/components/ui/accordion.tsx:46` (shared trigger, `items-start` + chevron)

**Suggested direction — fix LOCALLY, do NOT change the shared primitive:** `items-start` is the
shadcn default and is intentional for accordions with multi-line trigger text (chevron should
stay at the top there). Changing `ui/accordion.tsx:46` globally would affect **every** accordion
(e.g. the tx History/Queue rows in ISSUE-003, FAQs, etc.) and could regress multi-line triggers.
Instead, add `items-center` to the `AccordionTrigger` className in `PositionsWidget`
(it already passes `'relative overflow-x-auto px-4 py-4'` — append `items-center`), since this
row's trigger content is single-line and meant to be centered.

**Verify:** Chevron is vertically centered with the row content for collapsed and expanded
states; confirm no regression to other accordions (tx rows still fine). Single line of content,
so centering is safe here.

---

## ISSUE-009 — Assets page fonts look different from prod (likely NOT a bug) ✅

**Resolution (verified — NOT a bug, no code change):** Confirmed in code that `ui/typography.tsx`
sets no `font-family`, and `components/balances/AssetsTable/**` CSS sets no family — both inherit the
single global `DM Sans` (`globals.css`, `--font-sans` in `shadcn.css`). Assets and Spaces resolve to
the same family → meets the acceptance criterion. Did NOT add any font override.

**Route:** `/balances?safe=...` (Assets → Tokens), compared prod vs `feat/shadcn-migration`
**Area:** typography / design system (global)

**Observation:** Side-by-side, the Assets table text looks different on this branch vs prod.
Question raised: did the migration break the fonts, or is this the intended design-system font?
**Acceptance criterion (from product):** it's fine _as long as it matches the font used in Spaces._

**Investigation result — DO NOT "fix" the font-family; it is consistent:**

- Design system font is a single family: `DM Sans, sans-serif`
  (`packages/theme/src/tokens/typography.ts:9`).
- Applied globally on `html, body` (`apps/web/src/styles/globals.css:15-23`) and as Tailwind
  `--font-sans` (`apps/web/src/styles/shadcn.css:93`); woff2 weights 400/600/700 are loaded.
- The shadcn `Typography` component sets **no** font-family — it inherits the global DM Sans.
  Both **Spaces** (`features/spaces/...`) and **Assets** (`components/balances/AssetsTable/...`)
  use `Typography`; the Assets CSS modules only set font-weight/style, never family.
- The old MUI theme also used DM Sans (`packages/theme/src/generators/mui.ts:104`) — no legacy
  font ever existed in this repo.

**Conclusion:** Assets and Spaces resolve to the **same** font family (DM Sans) → matches the
acceptance criterion → **not a font-family regression.** Any visible prod-vs-branch difference
is therefore NOT the typeface; possible explanations to confirm, not assume:

- Different font-weight / size / line-height / letter-spacing in the new `Typography` variant
  mapping vs the old MUI variants (compare specific cells: header row, token name, fiat value).
- Live prod may simply be running an older build than this branch.

**Action (verification only):**

1. On THIS branch, open Assets and a Spaces page; confirm body text renders identically
   (DevTools → computed `font-family` on a token name vs a Spaces label). If equal → close this.
2. If a specific element looks wrong, treat it as a per-variant weight/size mismatch in
   `components/ui/typography.tsx`, not a font-family issue — and only then file a scoped item.

**Do NOT:** add a font-family override to AssetsTable or change the global font — that would
diverge from the design system and from Spaces.

---

## ISSUE-010 — Positions page: protocol cards have an unwanted gray border ✅

**Resolution:** Removed `border border-border` from the protocol card wrapper
(`features/positions/index.tsx:48`), keeping `bg-card rounded-xl overflow-hidden` — matching the
borderless `WidgetCard` convention. Scoped to the positions card only (AssetsTable border left
intact). _Residual: confirm cards read as distinct without the border, light/dark._

**Route:** `/balances/positions?safe=...` ("Total positions value")
**Area:** `features/positions`

**Symptom (from screenshot):** Each protocol card (e.g. the "Kiln" card) has a gray border that
should not be there — the design wants a borderless card (background + rounding/shadow only).

**Root cause (confirmed):** The card wrapper hardcodes a border:
`features/positions/index.tsx:48` →
`<div className="overflow-hidden rounded-xl border border-border bg-card">`.
The `border border-border` draws the gray outline.

This is inconsistent with the established card pattern: the dashboard `WidgetCard`
(`components/dashboard/styled.tsx:24`) uses `rounded-md bg-[var(--color-background-paper)] p-6`
with **no border** — and the dashboard PositionsWidget renders inside that borderless card.

**Files:**

- `apps/web/src/features/positions/index.tsx:48` (the bordered card wrapper)
- Reference (borderless card convention): `apps/web/src/components/dashboard/styled.tsx:24`

**Suggested direction:** Remove `border border-border` from the positions card wrapper so it
matches the borderless card style (keep `bg-card` + `rounded-xl` + `overflow-hidden`). If the
card needs visual separation from the page background, match whatever the other cards use
(elevation/shadow via the design system) rather than a gray border. Confirm against prod.

**Scope note:** The user pointed at the positions cards specifically. Do NOT blanket-remove
borders elsewhere — some cards (e.g. the AssetsTable card, ISSUE-001) intentionally use a
border. Keep this change scoped to the positions card, matching the borderless WidgetCard
convention used on the dashboard.

**Verify:** Positions page protocol cards render without the gray border in light + dark, and
still read as distinct cards against the page background.

---

## ISSUE-011 — Transaction audit log: "View on etherscan.io" (explorer) button icon is invisible ✅

**Resolution:** Added `fill="currentColor"` to both paths in `link.svg` **and** `link-bold.svg`
(part of the ISSUE-012 sweep). Restores the explorer icon in the audit-log button and the sidebar
header.

**Route:** Transaction details → AUDIT LOG panel (e.g. an executed/batch tx)
**Area:** `components/common/ExplorerButton` (icon asset) — same class of bug as ISSUE-002

**Symptom (from screenshot):** The explorer/etherscan button at the top-right of the AUDIT LOG
header shows no icon (tooltip "View on etherscan.io" appears, but the button is blank). The
adjacent copy button renders fine.

**Root cause (confirmed — identical pattern to ISSUE-002):** The explorer button renders
`link.svg`, whose `<svg>` has `fill="none"` and whose two `<path>`s have **no `fill`
attribute**, so they inherit `fill="none"` and are invisible. The button correctly applies
`text-inherit` + `size-5`, but there is no `currentColor` fill for that to color. The working
copy button uses `copy.svg`, whose path has `fill="currentColor"`.

**Also affected (same defect):** `apps/web/public/images/sidebar/link-bold.svg` — used by the
sidebar header's `ExplorerButton` (`SidebarHeader/index.tsx`). Both paths lack a fill → also
invisible. Fix both.

**Files:**

- `apps/web/public/images/common/link.svg` ← broken (audit-log explorer button)
- `apps/web/public/images/sidebar/link-bold.svg` ← broken (sidebar explorer button)
- `apps/web/src/components/common/ExplorerButton/index.tsx:30-48` (consumer; renders `LinkIcon` at `size-5`, `text-inherit`)
- `apps/web/src/components/transactions/TxSigners/index.tsx:67-82` (`TxAuditLogActions` — uses `ExplorerButton`)
- Reference (works): `apps/web/public/images/common/copy.svg` (path uses `fill="currentColor"`)

**Fix:** Add `fill="currentColor"` to both `<path>` elements in `link.svg` **and** in
`link-bold.svg` (mirroring `copy.svg`). No hard-coded color. After the fix, confirm the explorer
icon is visible on the audit-log button and the sidebar header in both light + dark.

**⚠️ Pattern sweep — see ISSUE-012 below.** This is the **3rd** invisible-icon bug from the same
root cause (ISSUE-002 `import.svg`; this one's `link.svg` + `link-bold.svg`). The shared
pattern warrants a deliberate audit, captured separately as ISSUE-012 — **do not bulk-edit.**

---

## ISSUE-012 — Icon audit: widespread invisible icons (`fill="none"` + no path fill) AND weak icon colors ✅

**Resolution:** Ran a programmatic classifier over all 203 SVGs in `public/images/**`, splitting
single-color UI icons (root `fill="none"`, shape elements lacking a fill, **no** gradients /
`illustration-*-fill` classes / embedded images / `var()`/hex fills / strokes) from the traps.
Added `fill="currentColor"` to every unfilled shape in the **20** confirmed single-color icons:
`apps/apps-icon`, `common/{add,add-outlined,delete,edit,import,link,owners,qr,question,search,success}`,
`notifications/{error,success,update,warning}`, `settings/permissions/shield`,
`settings/setup/replace-owner`, `sidebar/{link-bold,qr-bold}`.

**Notes on judgment calls:**

- **Status icons** (`notifications/error|success|warning|update`, `common/success`) were included
  after evidence showed they carry **no** baked color (byte-identical to `dev`) and are colored by
  the consumer (e.g. `ErrorMessage` uses `fill-current` + `text-[var(--color-warning-main)]`).
  Most other consumers (NestedSafesList, GasParams, MaliciousTxWarning, BatchTooltip,
  CsvTxExportModal, SeverityIcon, ActionCard) do **not** set `fill-current`, so those icons were
  invisible too. `currentColor` restores prod behavior without flattening any semantics.
- **Excluded** (correctly, by the classifier): multi-color illustrations and CSS-driven assets
  (`recovery.svg`, `messages/required.svg`, `settings/spending-limit/*`, `apps/code-icon.svg` — all
  use `illustration-*-fill` classes), `lightbulb.svg` (`fill="var(--color-text-primary)"`),
  `no-fee-campaign/check-icon.svg` (gradient), `tenderly-small.svg` (embedded PNG), and every
  no-assets/network-error/empty-batch illustration.

_Residual: an icon-gallery story (doc step 4) was not added — recommend as a follow-up so this class
of bug stays visible._

**Area:** `apps/web/public/images/**` (shared assets) — meta-issue behind ISSUE-002, ISSUE-011,
ISSUE-014. **Confirmed widespread and shipping — this is the single highest-leverage fix.**

**Why this exists:** SVGR is configured with `svgo: false` and no fill/attr replacement
(`next.config.mjs:110-134`), so an SVG's `fill="none"` on the root `<svg>` is preserved and
cascades to child `<path>`s. Any **single-color UI icon** that relies on inheriting the button's
text color but whose paths have no `fill="currentColor"` renders **invisible** when used as a
bare SVGR component (`<Icon className="size-* text-..." />`).

**Confirmed broken AND in active use (verified across multiple screens):** `common/import.svg`,
`common/link.svg`, `sidebar/link-bold.svg`, `apps/apps-icon.svg`, `common/edit.svg`,
`common/add.svg`, `common/delete.svg`, `settings/setup/replace-owner.svg`. On the Settings →
Setup (Members) screen alone, the edit-name, add-proposer, replace-signer, delete-signer, and
explorer-link icons are ALL blank. `edit.svg`/`delete.svg` are also used in the Address Book
action column → almost certainly blank there too. The shared structure means **most single-color
UI icons in the candidate list below are real bugs, not hypotheticals.**

**Heuristic sweep result (39 candidates — `fill="none"`, no path fill, no stroke):**
`sidebar/qr-bold.svg`, `sidebar/link-bold.svg`, `messages/required.svg`,
`explore-possible/swap-large.svg`, `explore-possible/swap-large-dark.svg`,
`hypernative/hypernative-icon.svg`, `hypernative/hypernative-logo.svg`,
`transactions/tenderly-small.svg`, `transactions/no-transactions.svg`, `common/search.svg`,
`common/owners.svg`, `common/question.svg`, `common/link.svg`, `common/import.svg`,
`common/network-error.svg`, `common/recovery.svg`, `common/add.svg`, `common/add-outlined.svg`,
`common/empty-batch.svg`, `common/lightbulb.svg`, `common/edit.svg`, `common/qr.svg`,
`common/delete.svg`, `common/success.svg`, `balances/no-assets.svg`, `balances/defi.svg`,
`apps/network-error.svg`, `apps/apps-icon.svg`, `apps/code-icon.svg`, `notifications/update.svg`,
`notifications/warning.svg`, `notifications/success.svg`, `notifications/error.svg`,
`common/no-fee-campaign/check-icon.svg`, `settings/setup/replace-owner.svg`,
`settings/permissions/shield.svg`, `settings/spending-limit/asset-amount.svg`,
`settings/spending-limit/beneficiary.svg`, `settings/spending-limit/time.svg`

**⚠️ The list is a HEURISTIC for the fill fix — most are real, but DO NOT blanket-add
`fill="currentColor"` to ALL of them.** Two trap categories that a blanket fix would BREAK
(leave these alone, fix per-icon only after rendering):

- **Multi-color illustrations** (`balances/no-assets.svg`, `transactions/no-transactions.svg`,
  `common/network-error.svg`, `common/empty-batch.svg`, `explore-possible/swap-large*.svg`,
  `hypernative/*-logo.svg`, `apps/network-error.svg`, `balances/defi.svg`) — likely carry their
  own per-shape fills/gradients/opacity my grep missed; forcing currentColor would flatten them.
  (NOTE: `apps/apps-icon.svg` is NOT in this group — it's a single-color icon, confirmed broken,
  fix it.)
- **Status icons with intended colors** (`notifications/error.svg` / `success.svg` /
  `warning.svg` / `update.svg`) — turning these one color removes the red/green/amber semantics.

**Recommended approach (this is broad enough to be its own PR):**

1. Triage the candidate list into (i) single-color UI icons and (ii) illustrations/status icons.
   The single-color UI icons are the fix targets; illustrations/status icons are excluded.
2. For each single-color UI icon, add `fill="currentColor"` to its real shape `<path>`s
   (mirroring `copy.svg`). This is safe and fixes the latent ones even if not yet reported.
3. Skip orphaned assets (lucide replaced many) — but adding a fill to an unused file is harmless.
4. Add a Storybook "icon gallery" story (or a quick visual check) rendering every icon on a
   neutral background so this class of bug is visible going forward.
5. `log`/note which were changed vs intentionally skipped.

**Confirmed-broken, fix now (single-color, verified in use):**
`common/import.svg` (ISSUE-002), `common/link.svg` + `sidebar/link-bold.svg` (ISSUE-011),
`apps/apps-icon.svg` (ISSUE-014), `common/edit.svg`, `common/add.svg`, `common/delete.svg`,
`settings/setup/replace-owner.svg` (this screen). High-confidence next targets (same structure,
single-color, likely broken — verify + fix): `common/qr.svg`, `sidebar/qr-bold.svg`,
`common/search.svg`, `common/owners.svg`, `common/question.svg`, `common/recovery.svg`,
`common/add-outlined.svg`, `common/lightbulb.svg`, `apps/code-icon.svg`, `messages/required.svg`,
`transactions/tenderly-small.svg`, `settings/permissions/shield.svg`,
`settings/spending-limit/{asset-amount,beneficiary,time}.svg`,
`common/no-fee-campaign/check-icon.svg`.

---

### ISSUE-012b — Icon COLOR consistency (separate from invisibility) 🔵

**Status: deferred (polish).** Lower severity than the invisibility fix (now resolved). Establishing
one secondary-action icon color convention requires a per-surface comparison against prod, which is
best done as a focused follow-up pass with the running app — not blind. Left open intentionally.

The user also flagged that icons are often the **wrong color** (too faint), not just invisible.
On the Setup screen, several icons that DO render use `text-muted-foreground` (faint gray) where
prod used a stronger token:

- `edit.svg` (edit name) — `text-muted-foreground`
- `settings/setup/replace-owner.svg` — `text-muted-foreground`
- "Learn more" external-link — inherits muted text
  vs. correctly-colored ones using explicit tokens: `copy.svg` → `text-[var(--color-border-main)]`,
  `address-book.svg` → `text-border`.

**Action (after the fill fix, so colors are actually visible):** Do a pass over migrated icon
buttons/links and confirm the color token matches prod. Establish ONE convention for secondary
action icons (e.g. `text-[var(--color-border-main)]`) instead of the mix of
`text-muted-foreground` / no-class / ad-hoc tokens. Compare against prod per surface; don't
guess. This is a polish pass, lower severity than the invisibility fix.

---

## ISSUE-013 — Layout not mobile-friendly: content keeps a 230px left offset at mobile widths ✅

**Resolution:** In `PageLayout/styles.module.css`, inside the existing `@media (max-width: 899.95px)`
block, reset the elevated topbar header padding (`.topbarElevated header` and the
`:not(.topbarNoSidebar)` variant) to `var(--space-3)` (1.5rem) — mirroring how `.main` already
resets its 230px `padding-left` to 0. Both previously kept the desktop 230px offset on mobile. Uses
the same token as `.content main` and the `topbarNoSidebar` variant. _Residual: the broader "mobile
friendly" ask wants a live responsive pass at ≤899.95px and ≤599.95px (sidebar Sheet overlay,
horizontal overflow) — confirm in the running app, light/dark, sidebar open/closed._

**Route:** Any page at narrow/mobile viewport (reported on `/transactions/history?safe=...`)
**Area:** `components/common/PageLayout` (global layout)

**Symptom (from screenshot):** At narrow widths the layout breaks — a large empty gap on the
left (~the old 230px sidebar column) and the page content is pushed right and cut off. The
sidebar/layout doesn't collapse to a mobile-friendly full-width layout.

**Confirmed CSS defect:** `PageLayout/styles.module.css` resets the main content's left padding
on mobile but NOT the elevated (fixed/scrolled) topbar header's:

- `.main { padding-left: 230px }` (line 73) **is** reset to `0` at `@media (max-width: 899.95px)`
  (lines 162-165). ✅
- `.topbarElevated header { padding-left: 230px }` (line 24) and
  `.topbarElevated:not(.topbarNoSidebar) header { padding-left: calc(230px + 1.5rem) }` (line 29)
  are **never reset** — the `@media (max-width: 899.95px)` block (lines 36-48) only adjusts
  `.topbar` `left`/`position`, not the elevated header padding. So once the topbar is elevated
  (fixed on scroll), it keeps the 230px left offset on mobile, pushing the header content right.

**Files:**

- `apps/web/src/components/common/PageLayout/styles.module.css:16-48` (elevated topbar padding + the mobile media query that misses it)
- `apps/web/src/components/common/PageLayout/index.tsx` (class toggling)
- `apps/web/src/components/common/PageLayout/SideDrawer.tsx` (uses `useIsBelowMd`, breakpoint 899.95px)
- `apps/web/src/hooks/useMediaQuery.ts` (`useIsBelowMd` → `(max-width:899.95px)`)

**Suggested direction:** Inside the `@media (max-width: 899.95px)` block, reset the elevated
header padding (`.topbarElevated header`, and the `:not(.topbarNoSidebar)` variant) to the
mobile value (`1.5rem` / `var(--space-3)`), mirroring how `.main` is reset. Use theme tokens,
not raw 230px, ideally factor the sidebar width into a CSS var so the desktop/mobile values stay
in sync.

**⚠️ Verify in the running app (broader ask = "UI should be mobile friendly"):** The confirmed
defect explains a 230px offset, but the screenshot shows the WHOLE content shifted — reproduce at
the exact breakpoints (≤899.95px and ≤599.95px) and confirm whether anything else contributes
(e.g. the sidebar `Sheet` overlay, `.main` reset actually applying, horizontal overflow from a
fixed-width child). Treat this as a focused responsive pass on `PageLayout` at mobile widths,
checked live — not just the one-line padding reset. Check both light + dark, with sidebar
open/closed.

---

## ISSUE-014 — "Batched transactions" drawer: missing icon, wrong corner radius, sits beside (not above) the sidebar ✅

**Resolution:**

- **(a) Missing icon:** `apps/apps-icon.svg` got `fill="currentColor"` on its 4 paths (ISSUE-012
  sweep). The other two options already render. Icon _sizing_ vs prod not adjusted (needs visual
  compare).
- **(b) Rounded corners:** added `rounded-l-2xl` to the batch `SheetContent` className.
- **(c) Above the dimmed app:** added a backward-compatible optional `overlayClassName` prop to the
  shared `ui/sheet.tsx` (default unchanged → other Sheet consumers unaffected), and on the batch
  `SheetContent` raised both overlay and content to `z-[100]` (above the topbar's `z-99`). Verified
  `.shadcn-scope` carries no transform/filter/contain, so it creates no stacking context and
  `fixed inset-0` covers the full viewport — sidebar + topbar now dim behind the drawer.

_Residual: confirm live — drawer above a dimmed sidebar+topbar, left corners rounded, all three
option icons visible at correct size, light/dark, desktop + mobile; re-check the account SideDrawer
(also uses `ui/sheet.tsx`) is unaffected._

**Route:** Any page → open the batch sidebar (stack icon in the header)
**Area:** `features/batching/components/BatchSidebar`

**Symptom (left = prod/correct, right = branch):** Three regressions on the right-anchored
"Batched transactions" drawer:
(a) the "Safe App transactions" icon is missing; icon/illustration sizing looks off vs prod;
(b) the panel should have rounded corners on the **left side only** — currently it has none;
(c) the drawer should render **on top of** the app with the sidebar (and topbar) dimmed in the
background — currently the sidebar/topbar stay fully lit beside it.

**Drawer component:** shadcn `Sheet` (fully migrated, no MUI).

- `features/batching/components/BatchSidebar/index.tsx:66-76` —
  `<SheetContent side="right" showCloseButton={false} className="w-[700px] max-w-[100vw] gap-0 p-0 sm:max-w-[min(700px,100vw)]">`
- `features/batching/components/BatchSidebar/EmptyBatch.tsx` — the empty-state content + icons.

**(a) Missing icon (confirmed) + sizing:**

- "Safe App transactions" uses `AppsIcon` = `public/images/apps/apps-icon.svg`
  (`EmptyBatch.tsx:5,38`). That SVG has `fill="none"` on `<svg>` and **no path fill** → invisible.
  Same root cause as ISSUE-002/011; `apps/apps-icon.svg` is in the ISSUE-012 candidate list —
  **now confirmed used + broken.** Fix: add `fill="currentColor"` to its 4 paths.
- The other two render fine (`sidebar/assets.svg` and `sidebar/settings.svg` use
  `fill="currentColor"`). Header illustration `empty-batch.svg` uses the
  `.illustration-*-fill` CSS classes → fine.
- "Size not accurate": all three options use `size-6`; header is `size-[110px]`. Compare to prod
  and adjust the variant sizes if they differ (verify against the left screenshot).

**(b) Rounded corners (confirmed):** `SheetContent` (and the base `ui/sheet.tsx` right-side
classes) apply `border-l` but **no border-radius**. Add `rounded-l-2xl` (or the design's radius)
to the BatchSidebar `SheetContent` className so only the left edge is rounded.

**(c) Not above the sidebar (confirmed cause):** The Sheet overlay + content are `z-50`
(`ui/sheet.tsx:61,86`), but the **topbar is `z-99`** (`PageLayout/styles.module.css:18`) and the
persistent desktop sidebar sits in its own stacking context — so they aren't covered/dimmed.
Also, `SheetPortal` renders into the scoped `usePortalContainer()` container (the
`.shadcn-scope` div), not the document root, so the `fixed inset-0` overlay may be scoped to the
content area rather than the full viewport (incl. the left sidebar). Fix direction: raise the
batch Sheet's overlay + content z-index above the topbar (≥ the topbar's 99) and ensure the
overlay covers the whole viewport (portal to root, or make the overlay span the sidebar), so the
sidebar + topbar dim behind it. **Verify against the sidebar's own Sheet z-index so the two
drawers don't fight.**

**Files:**

- `apps/web/src/features/batching/components/BatchSidebar/index.tsx:66-76` (SheetContent className: add `rounded-l-*`, raise z-index)
- `apps/web/src/features/batching/components/BatchSidebar/EmptyBatch.tsx` (icons/sizes)
- `apps/web/public/images/apps/apps-icon.svg` (invisible — add path fills)
- `apps/web/src/components/ui/sheet.tsx:56-104` (base Sheet z-50, portal container — shared, change carefully)
- Reference for stacking: `apps/web/src/components/common/PageLayout/styles.module.css:18` (topbar z-99)

**⚠️ Shared-primitive caution:** the z-index/portal fix may touch `ui/sheet.tsx`, which is used
by the sidebar drawer and every other Sheet. Prefer a scoped fix (className/z override on the
batch `SheetContent`) over changing the base component; if the base must change, re-check the
account sidebar drawer and any other Sheet consumer.

**Verify (live):** Batch drawer opens above a dimmed sidebar + topbar, left corners rounded,
all three option icons visible at correct size, light + dark, desktop + mobile.
