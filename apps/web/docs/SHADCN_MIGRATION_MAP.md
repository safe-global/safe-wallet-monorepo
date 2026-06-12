# MUI → shadcn Migration Map

> Mapping the surface,
> token roots already shared —
> migrate slice by slice.

A reference for migrating the web app off MUI (`@mui/material`) onto the in-house
shadcn/ui design system (`@/components/ui`). The goal is **consistency during an
incremental migration**, not a big-bang rewrite.

_Generated 2026-06-04. Counts are approximate (file-import counts) and will drift — re-run the commands in the appendix to refresh._

---

## TL;DR

- **~781 files** import `@mui/material` (~39% of `src/`). **167 files** import `@mui/icons-material` (~99 distinct icons).
- **45 shadcn primitives already exist** in `src/components/ui/`. Component coverage is **high** — most MUI components already have a target.
- **The long pole is NOT "build 40 missing components."** It is two pervasive, consistency-sensitive workstreams:
  1. **Layout primitives** (`Box`, `Stack`, `Grid`, `Paper`, `Container`) → Tailwind utility divs. No shadcn component; this is where spacing/visual drift happens.
  2. **Icons** (`@mui/icons-material` + `SvgIcon`) → `lucide`. Different visual language; needs a mapping table.
- **Consistency backbone is already in place:** both `vars.css` (consumed by `globals.css` → shadcn) and the MUI theme are generated from `@safe-global/theme`. Colors/spacing tokens share one source, so a half-migrated screen won't drift in color. **This is the mechanism that makes incremental migration safe.**
- **Migrate whole features/routes, not scattered leaf swaps.** Spaces is the pioneer (already uses `.shadcn-scope`) — use it as the model.

---

## 1. The consistency backbone (why incremental is safe)

```
@safe-global/theme  ──┬──>  generateMuiTheme()         ──>  MUI <ThemeProvider>
  (palettes, spacing) │
                      └──>  scripts/css-vars.ts        ──>  src/styles/vars.css
                                                              │ (@import)
                                                       src/styles/globals.css  ──>  shadcn (.shadcn-scope)
```

Both systems read the **same tokens**. `vars.css` is auto-generated (`yarn css-vars`) — **never edit it directly**. As long as new shadcn code uses the theme CSS vars / Tailwind tokens (not hard-coded colors), a screen that is half MUI / half shadcn stays visually coherent.

**Provider coexistence** (`src/pages/_app.tsx`): MUI `<ThemeProvider>` wraps the tree (outer), `<ShadcnProvider dark={…}>` is nested inside. shadcn components render into a `.shadcn-scope` container so their scoped CSS vars apply. Both can run simultaneously — that is what enables feature-by-feature migration.

---

## 2. Component mapping (MUI → shadcn)

### ✅ Covered — direct shadcn equivalent exists

| MUI                                          | Uses        | shadcn target                    |
| -------------------------------------------- | ----------- | -------------------------------- |
| `Button`                                     | 158         | `button`                         |
| `Tooltip`                                    | 96          | `tooltip`                        |
| `IconButton`                                 | 58          | `button` (icon variant)          |
| `Divider`                                    | 55          | `separator`                      |
| `CircularProgress`                           | 47          | `spinner`                        |
| `Alert` / `AlertTitle`                       | 47 / 14     | `alert`                          |
| `Skeleton`                                   | 41          | `skeleton`                       |
| `Card` / `CardActions`                       | 36 / 13     | `card`                           |
| `Dialog` / `DialogContent` / `DialogActions` | 7 / 27 / 22 | `dialog` (or `sheet` / `drawer`) |
| `TextField`                                  | 19          | `input` + `field` + `label`      |
| `MenuItem`                                   | 17          | `dropdown-menu` / `select`       |
| `FormControlLabel` / `FormControl`           | 16 / 13     | `field` + `label`                |
| `Accordion*`                                 | 13×3        | `accordion`                      |
| `Checkbox`                                   | 11          | `checkbox`                       |
| `Select`                                     | 9           | `select` / `native-select`       |
| `Switch`                                     | 7           | `switch`                         |
| `Collapse`                                   | 8           | `collapsible`                    |
| `Typography`                                 | 382         | `typography`                     |
| `Snackbar` / toasts                          | —           | `sonner`                         |

### 🟡 Layout primitives — NO shadcn component (→ Tailwind)

**This is the #1 consistency risk.** These become utility-class `<div>`s. Decide one convention before fan-out so every dev translates the same way.

| MUI         | Uses | Translation                                                               |
| ----------- | ---- | ------------------------------------------------------------------------- |
| `Box`       | 325  | `<div className="…">` with Tailwind utilities                             |
| `Stack`     | 132  | `<div className="flex flex-col gap-…">` (map MUI `spacing` → token scale) |
| `Paper`     | 110  | `<div>` with surface bg/border, or `card`                                 |
| `Grid`      | 54   | `grid grid-cols-… gap-…`                                                  |
| `Container` | 8    | max-width wrapper utility                                                 |

**Required decision:** a documented spacing-token mapping (MUI `spacing(n)` ↔ Tailwind/`--space-*`) and standard flex/grid idioms. Without it, drift is guaranteed.

### 🟡 Icons — NO equivalent visual (→ lucide)

| MUI                     | Uses                          | Target                           |
| ----------------------- | ----------------------------- | -------------------------------- |
| `SvgIcon`               | 161                           | inline SVG / lucide              |
| `@mui/icons-material/*` | 167 files, ~99 distinct icons | `lucide` (per `components.json`) |

**Required decision:** a MUI-icon → lucide-icon mapping table. MUI and lucide icons differ in weight/style — ad-hoc swaps will look inconsistent. Some MUI icons have no lucide twin and need a kept custom SVG.

### 🔴 Genuine gaps — no clean target, pick a pattern

| MUI                                  | Uses      | Note                                                                                                                   |
| ------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Link`                               | 24        | No `link` primitive. Decide: styled `<a>`/Next `Link` + typography, or add a `link` component.                         |
| `Chip`                               | 20        | Map to `badge`? Or add a `chip` primitive? **Confirm intent.**                                                         |
| `List` / `ListItem` / `ListItemText` | 9 / 9 / 7 | No `list` primitive — semantic `<ul>`/`<li>` + utilities, or add one.                                                  |
| `useMediaQuery` / `useTheme`         | 14 / 10   | Hooks, not components. Replace with a Tailwind-breakpoint hook / CSS, or keep a thin shim. **Decide one shared hook.** |
| `Menu`                               | —         | Likely covered by `dropdown-menu` / `context-menu` — verify per use.                                                   |
| `Fab`                                | —         | No target; usually a `button` variant.                                                                                 |

---

## 3. Where the work is (by area)

### Features (`src/features/`)

| Feature                      | Files w/ MUI                                                                                                                                    | Status / note                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **spaces**                   | 64                                                                                                                                              | 🚧 In flight — pioneer, already uses `.shadcn-scope`. **Finish first.** |
| **myAccounts**               | 36                                                                                                                                              | 🚧 Partially migrated (uses `.shadcn-scope`). **Finish next.**          |
| hypernative                  | 25                                                                                                                                              |                                                                         |
| safe-shield                  | 21                                                                                                                                              |                                                                         |
| recovery                     | 19                                                                                                                                              |                                                                         |
| swap                         | 15                                                                                                                                              |                                                                         |
| walletconnect                | 14                                                                                                                                              |                                                                         |
| positions                    | 11                                                                                                                                              |                                                                         |
| earn / counterfactual        | 9 / 9                                                                                                                                           |                                                                         |
| spending-limits / proposers  | 8 / 7                                                                                                                                           |                                                                         |
| batching / nfts / multichain | 7 / 5 / 5                                                                                                                                       |                                                                         |
| _others (≤4)_                | tx-notes, stake, no-fee-campaign, speedup, targeted-outreach, portfolio, gtf, wallet, support-chat, safe-overview, ledger, bridge, actions-tray | smaller                                                                 |

### Components (`src/components/`)

| Area                                         | Files w/ MUI | Note                                                                                 |
| -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| **common**                                   | 124          | Shared building blocks — migrate the high-reuse ones early so features inherit them. |
| **transactions**                             | 59           | 💰 Heavy composite — real cost center.                                               |
| **tx-flow**                                  | 58           | 💰 Heavy composite (modals, multi-step).                                             |
| **tx**                                       | 53           | 💰 Heavy composite.                                                                  |
| safe-apps                                    | 33           |                                                                                      |
| settings                                     | 25           |                                                                                      |
| sidebar / new-safe                           | 23 / 23      | new-safe is a heavy multi-step flow.                                                 |
| dashboard                                    | 19           |                                                                                      |
| balances                                     | 14           |                                                                                      |
| safe-messages                                | 13           |                                                                                      |
| address-book / notification-center / welcome | 7 / 4 / 3    |                                                                                      |

> **Weight by complexity, not file count.** A file importing MUI for one `<Box>` is trivial; a `tx-flow` modal is heavy. The 💰 areas (transactions, tx-flow, tx, new-safe) are the true cost centers regardless of raw counts.

---

## 4. Recommended sequence

Migration **unit = a whole feature/route**, shipped internally consistent (the `.shadcn-scope` slice model from Spaces). This avoids a half-migrated "frankenstein" screen.

1. **Lock the conventions** (blocks everything): spacing-token mapping for `Box`/`Stack`/`Grid`; the lucide icon mapping table; decisions for `Link`, `Chip`, `List`, `useMediaQuery`/`useTheme`. Add the missing primitives that the decisions call for.
2. **Migrate high-reuse `components/common` primitives** so downstream features inherit shadcn versions instead of re-wrapping MUI.
3. **Finish in-flight features:** Spaces (64) → myAccounts (36).
4. **Proceed feature-by-feature**, smallest/lowest-risk first to build muscle, deferring the 💰 heavy composites (tx-flow, transactions, tx, new-safe) until the primitives and conventions are battle-tested.
5. **Tackle the heavy tx composites last**, when the component set and patterns are stable.
6. **Remove MUI providers** from `_app.tsx` only once `@mui/material` import count hits zero.

**Consistency guardrails to add:** an ESLint rule discouraging new `@mui/material` imports outside not-yet-migrated areas; track the `@mui/material` import count as a burn-down metric.

---

## 5. Open decisions (need a human)

- `Chip` (20) → `badge`, or build a `chip` primitive?
- `Link` (24) → styled anchor + typography, or new `link` primitive?
- `List`/`ListItem` (25 combined) → semantic markup, or a `list` primitive?
- `useMediaQuery`/`useTheme` (24 combined) → which shared replacement hook?
- Icon strategy for the ~MUI icons with no lucide equivalent (keep custom SVGs?).

---

## Appendix — commands used

```bash
# Files importing MUI
grep -rl "@mui/material" src --include="*.tsx" --include="*.ts" | wc -l
grep -rl "@mui/icons-material" src --include="*.tsx" --include="*.ts" | wc -l

# MUI usage per feature / component subdir
for d in src/features/*/; do echo "$(grep -rl '@mui/material' "$d" --include='*.tsx' --include='*.ts' | wc -l)  $(basename $d)"; done | sort -rn

# Most-used MUI components
grep -rho "import {[^}]*} from '@mui/material'" src --include="*.tsx" \
  | grep -o "{[^}]*}" | tr ',' '\n' | tr -d '{} ' | sort | uniq -c | sort -rn

# Existing shadcn primitives
ls src/components/ui/

# Distinct MUI icons
grep -rho "from '@mui/icons-material/[A-Za-z]*'" src --include="*.tsx" | sort -u | wc -l
```
