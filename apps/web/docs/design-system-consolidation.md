# Design System consolidation proposal

**Goal:** the fewest variants and sizes that still cover real needs, so the app stays uniform.
A variant/size earns its place only if it has real, distinct usage — otherwise it's a source of
drift and should be merged into the common one.

**Method:** usage counts are real call sites under `apps/web/src`, excluding `*.test.*` and
`*.stories.*`, scoped to each component (the shared `variant=`/`size=` attribute names on other
components are filtered out). Counts are approximate.

**Status:** proposal only — nothing here is applied yet. Each row is a small, independent migration.

---

## Summary

| Component       | Now                            | Proposed                       | Net                             |
| --------------- | ------------------------------ | ------------------------------ | ------------------------------- |
| **Buttons**     | 8 variants · 11 sizes          | 6 variants · 9 sizes           | −2 variants, −2 sizes           |
| **Dropdowns**   | 3 primitives · 3 trigger sizes | 3 primitives · 2 trigger sizes | −1 size (NativeSelect deferred) |
| **Text fields** | 4 sizes · 2 skins              | 2 sizes · 2 skins              | −2 sizes                        |
| **Search**      | size + skin props exposed      | 1 box, no props                | collapse to one                 |
| **Tabs**        | 4 variants                     | 2 variants                     | −2 variants                     |

---

## Cross-component harmony (read this first)

Trimming each component in isolation isn't enough: controls that sit **in the same row must share a
height** so a button, field, select and search read as one system. The good news — heights already sit
on one 4px scale; keeping that alignment is the real constraint on the cuts below.

**Shared control-height scale**

| Tier      | Height    | Button                                 | Input / Select / Search |
| --------- | --------- | -------------------------------------- | ----------------------- |
| compact   | 32px      | `sm` · `icon-sm`                       | `sm`                    |
| default   | **36px**  | `default` · `icon`                     | `default`               |
| prominent | 40px      | `lg` · `action` · `submit` · `icon-lg` | `lg`                    |
| xl        | 48 / 66px | `xl` = 48                              | `hero` = 66 ✓           |

**The rule:** pick one tier per row; every control in it uses that tier. The default row is **36px
(`default`)** — so a button placed **inline with a field** must be `default` (h-9), never `action` (h-10)
or `sm` (h-8), or it sits 4px off.

**Findings**

- ✅ The three everyday tiers (32 / 36 / 40) are consistent across Button, Input, Select and Search — any
  row can be built at one tier with matching controls.
- ✅ Search and Select never appear in the same component, so their heights don't have to match each other.
- ✅ **`xl` name collision — resolved:** the Input/InputGroup/SearchInput 66px field is now `hero`; Button
  keeps `xl` (48px). One token name → one height.
- ✅ **`TokenAmountInput` adornments — resolved:** inside the 66px amount field the `Max` button and token
  `Select` are both `sm` (32px), matching the h-8 vertical Separator between them.
- ℹ Form footers (Clear/Apply, Cancel/Confirm) are their own row of `submit`/`action` buttons (40px) below
  the fields — that's intended, not an inline mismatch.

**Constraint on the cuts:** don't drop a size a real row needs — this is exactly why **Select `sm` is kept**.
The TokenAmountInput adornment and the CurrencySelect header picker are genuine 32px compact contexts, so `sm`
earns its place; only the truly-unused sizes are dropped (Input `sm`/`lg`, Select `lg`). If a future row pairs
an `action`/`lg` button inline with a field, give the field the matching height rather than leaving a 4px step.

---

## Buttons

`components/ui/button.tsx` — 422 `<Button>` sites across 267 files (125 use no `variant`, 161 no
`size` → both fall through to defaults). Most buttons come through a size-locking preset
(`SubmitButton`=submit, `ActionButton`=action, `OnboardingFooter`=xl, `IconAction`=icon-sm,
`DialogActions`=submit).

**Variants — keep 6, drop 2**

| Variant                                         | ~uses                      | Verdict                                                                    |
| ----------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| default, ghost, outline, destructive, secondary | 159 / 165 / 71 / 11 / 10   | keep                                                                       |
| surface                                         | 2 (Button)                 | keep — shared token (also SelectTrigger/InputGroup); thin on Button, watch |
| **destructive-outline**                         | 2 (DangerZoneSection only) | **→ `destructive`**                                                        |
| **link**                                        | 2                          | **→ `<Link>` component / `ghost`** (a dedicated `Link` already exists)     |

**Sizes — keep 9, drop 2**

| Size                                | ~uses                        | Verdict                                  |
| ----------------------------------- | ---------------------------- | ---------------------------------------- |
| default, sm, lg, action, submit, xl | 165 / 83 / 31 / 26 / 40 / 10 | keep (action/submit/xl are preset-owned) |
| icon, icon-sm, icon-xs              | 18 / 89 / 11                 | keep                                     |
| **xs**                              | 0 (dead)                     | **remove**                               |
| **icon-lg**                         | 1 (ActionsTray)              | **→ `icon`**                             |

**Harmony:** a button placed **inline with a field/select uses `default` (36px)** to match it; `action` /
`submit` / `xl` are for standalone CTA / footer rows only (see Cross-component harmony above).

**Later (not now):** `submit` = `action` + `min-w`; presets rely on the stable min-width for the
label→spinner swap. Could collapse to `action` + a `minWidth` prop eventually.

---

## Dropdowns

`Select` (`ui/select.tsx`), `NativeSelect` (`ui/native-select.tsx`), `Combobox` (`ui/combobox.tsx`).

**Primitives — keep 2, drop 1**

- **Select** (26 uses) — keep. The dominant single-select.
- **Combobox** (3 uses) — keep. Autocomplete + multi-select chips are behaviours Select lacks.
- **NativeSelect** (1 use — `EnhancedTable` page-size picker) — **deprecate (deferred):** the `Select`
  migration is a native→popup behavioural change on a shared, app-wide table (and its interaction tests), so
  it should land as its own verified change rather than bundled with the mechanical size cuts.

**SelectTrigger sizes — keep 2, drop 1** _(revised)_

- `default` — keep, the dominant size.
- **`sm`** — **kept.** Two genuine compact contexts (TokenAmountInput adornment, CurrencySelect header
  picker) earn it a place rather than folding to `default`.
- **`lg`** (0 — dead) → **removed.**

**SelectTrigger variants — keep 3** (`default` 22 · `surface` 3 · `ghost` 1), and move
`NetworkSelector`'s hand-rolled `className` strip (`bg-transparent border-none shadow-none p-0`) onto
`variant="ghost"` so the stripped-trigger skin lives in one place.

---

## Text fields

`components/ui/input.tsx` (+ `input-group.tsx`, same keys).

**inputSize — keep 2, drop 2**

- `default` (~45) — keep. `hero` (66px, ~6 — Safe creation / big filters; renamed from `xl`) — keep.
- **`sm`** (1 — SidebarInput) → **`default`** (override height via className if the sidebar truly needs it).
- **`lg`** (1 — reaches Input only via SearchField) → **`default`**.

**variant — keep both** `default` (transparent) and `surface` (bg-card). Intentionally different
surfaces, both actively used — do **not** merge.

**Harmony:** resolved — the Input 66px field is now `hero`, Button keeps `xl` (48px), so one name maps to
one height. Still to do: align `TokenAmountInput`'s inline `Max` button (`sm`) and token `Select`
(`default`) to the same tier.

Net: **2 sizes × 2 skins**.

---

## Search

`SearchInput` (`ui/search-input.tsx`, wraps InputGroup) + `SearchField` preset (locks `lg`).

Every search box uses the **surface** skin, and the only heights are `default` (h-9, 9 sites) and
`lg` (h-10, 3 sites via SearchField) — 4px apart.

**Proposal:** one search box. `SearchField` at a single height, `variant` hardcoded to `surface`.
**Remove `inputSize` and `variant` from `SearchInput`'s public API** — they're never overridden in
the search path and only invite divergence. (The underlying `InputGroup` keeps its full scale for
non-search fields — NameInput, NumberField, DatePicker, etc.)

---

## Tabs — "why not one underline type?"

`components/ui/tabs.tsx` — `TabsList variant`: `default | line | nav | segmented`. You're right that
Line and Nav are near-duplicates.

**Proposal: 4 → 2 variants.**

- **`underline`** — folds **nav** + **line**. Both are underline tabs; the only deltas are cosmetic:
  colour (`nav` = `--color-primary-main`, `line` = foreground), weight (bold vs medium), inter-tab gap.
  Make one `underline` variant with the page-nav look as default and the neutral in-content look via a
  prop/className.
  - `nav` (NavTabs → Assets / Safe Apps / Settings / Transactions headers) · `line` (Spaces address book, members).
- **`toggle`** — folds **default** + **segmented**. Both are pill-on-track toggles; they differ only in
  scale and track colour. One `toggle` variant, with the larger welcome-switch scale via a `size` prop.
  - `default` (SecurityHub drawer) · `segmented` (Accounts / Workspaces switch on My accounts).

Trade-off: this is the only change with a **visible design shift** (nav loses its brand colour /bold, or
we make that the underline default). Needs design sign-off; the others are mechanical.

---

## Suggested sequencing

1. ✅ **Zero-risk removals** (dead values): Button `xs`; SelectTrigger `lg`. _(landed)_
2. ✅ **1-site / size merges:** Button `icon-lg`→`icon` (ActionsTray); Input `sm`/`lg`→`default`
   (SidebarInput, SearchField); Input + InputGroup collapsed to `default`/`hero`. Select `sm` **kept**
   (see Dropdowns). NativeSelect→Select **deferred** (behavioural, see above). _(landed except NativeSelect)_
3. ✅ **Variant merges:** Button `destructive-outline`→`destructive` (DangerZoneSection); `link`→`ghost`
   (EditableApprovalItem) / `Link` component (WorkspaceBanner). _(landed)_ — NetworkSelector inline strip →
   `variant="ghost"` **deferred** (embedded `h-full` layout risk); `SearchInput.inputSize` now narrows to
   `default`/`hero` (full public-API lock deferred, to avoid churning the DS stories).
4. ⏳ **Design decision:** Tabs 4 → 2 variants (underline + toggle) — **needs design sign-off before landing.**

After each merge, the now-unused key is removed from the component's `cva` so it can't be reintroduced.
