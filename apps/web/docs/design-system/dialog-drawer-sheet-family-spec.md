# Dialog / Drawer / Sheet family — sweep spec

> Executable handoff. Method: [`../DESIGN_SYSTEM_CONSISTENCY.md`](../DESIGN_SYSTEM_CONSISTENCY.md). Backlog item **C2**.

Primitives: `apps/web/src/components/ui/{dialog,sheet,drawer}.tsx` · Stories: `stories/{dialog,drawer,sheet}.stories.tsx`

## Status — DONE (2026-07-10)

- **Dialog**: `DialogContent` gained cva `size` (default=`max-w-[500px]`, xs/sm/md/lg/xl = MAX_WIDTH_MAP),
  `padding` (none/md — **no default padding**), `surface` (default/card/paper); `DialogHeader`/`DialogFooter`
  gained `divided` (true / `subtle`=`border-border/50`). Defaults are byte-identical (default Content still
  renders `max-w-[500px]` with no body padding).
- **ModalDialog** now passes token widths via `size=` (class-based); only non-token/arbitrary widths and
  `fullScreen` keep the inline `style` + the CSS-module `min-width`/`border-radius` overrides.
- **Sheet**: `SheetContent` gained `variant="floating"`, `size`, `surface`, `padding`; Header/Footer `divided`.
  **Caveat:** the base `data-[side]` widths win on specificity, so `size` is effectively a no-op for left/right
  sheets — the 3 real sheets (SecurityReportDrawer, BatchSidebar, SideDrawer) render at their existing widths
  (zero regression); SecurityReportDrawer keeps `w-[440px]!` grandfathered (floating without `!` measured
  1050px). Making `size` functional (fold base widths into `size="sm"` default) is a design-nod follow-up.
- **Drawer**: unchanged; the one radius outlier (SafeAppPreviewDrawer) is grandfathered.
- Call sites migrated to `size`/`padding`/`surface`/`divided`; odd non-token widths (420/440/560/700/960/423)
  and bespoke paddings grandfathered with justified disables; redundant `max-w-[500px]` deleted.
- **Dialog/Sheet/Drawer ESLint guard is live** (`dsDialogClassnameRule`).

Below is the original executable spec (kept for reference).

**None use cva today** — all inline `cn('...base...', className)`. No `size`/`variant`/`padding` props on Content. Sheet has a hand-rolled `side`; Drawer keys off `data-[vaul-drawer-direction]`. Every width/padding/surface need reaches into `className` — that is the drift.

## Current state (key facts)

- **dialog.tsx** (Base UI `@base-ui/react/dialog`): `DialogContent` (Popup) base `bg-dialog … w-full max-w-[500px] rounded-xl shadow-lg`, **no padding/gap/flex**. `showCloseButton` default true (hard-coded ghost icon top-right). `DialogHeader`/`DialogFooter`: `gap-{1.5,2} p-4 flex flex-col` (Footer `mt-auto`). Title `text-lg font-medium`.
- **sheet.tsx** (Base UI dialog, edge-slide): `SheetContent` props `side` (default `right`), `showCloseButton`, `overlayClassName`. Base `bg-background flex flex-col gap-4 shadow-lg` + per-`data-[side]` positioning; left/right `w-3/4 sm:max-w-sm`. Header/Footer like Dialog.
- **drawer.tsx** (Vaul): `DrawerContent` keys off `data-[vaul-drawer-direction]`; bottom/top `rounded-{t,b}-xl`, left/right `w-3/4 sm:max-w-sm`. Drag handle for bottom. No padding.
- **`MAX_WIDTH_MAP`** (`common/ModalDialog/index.tsx:12`): `{ xs:444, sm:600, md:900, lg:1200, xl:1536 }` — applied as inline `style={{maxWidth}}` + module CSS (`min-width:600px`, `border-radius:24px`, fullscreen). This is the width scale to move onto Content `size`.
- **`DialogActions`** preset already consumed by ~20 dialogs.

## Proposed additions (cva)

### DialogContent — `size` + `padding` + `surface`

```ts
const dialogContentVariants = cva(
  'bg-dialog … fixed top-[50%] left-[50%] z-[var(--z-overlay)] w-full -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-lg duration-200',
  {
    variants: {
      size: {
        default: 'max-w-[500px]',
        xs: 'max-w-[444px]',
        sm: 'max-w-[600px]',
        md: 'max-w-[900px]',
        lg: 'max-w-[1200px]',
        xl: 'max-w-[1536px]',
      },
      padding: { none: 'p-0', md: 'p-6' },
      surface: { default: '', card: 'bg-card', paper: 'bg-[var(--color-background-paper)]' },
    },
    defaultVariants: { size: 'default', surface: 'default' }, // NO default padding — Content never had body padding
  },
)
```

`size` mirrors `MAX_WIDTH_MAP` so **ModalDialog can drop its inline `style` and pass `size={maxWidth}`**. `padding="none"` is the sanctioned replacement for the ~16 `p-0` sites.

### Header/Footer `divided` (all three)

```ts
const dialogHeaderVariants = cva('gap-1.5 p-4 flex flex-col', { variants: { divided: { true: 'border-b' } } })
const dialogFooterVariants = cva('gap-2 p-4 mt-auto flex flex-col', { variants: { divided: { true: 'border-t' } } })
```

Consider `divided="subtle"` → `border-{b,t} border-border/50` (AccountsModal uses `/50`).

### SheetContent `variant="floating"` + Sheet/Drawer `size`

```ts
variant: { default:'', floating:'inset-y-3! right-3! h-auto! max-w-[calc(100vw-24px)]! rounded-3xl border-0! shadow-xl overflow-hidden' }
size:    { sm:'w-3/4 sm:max-w-sm', md:'w-[440px] max-w-[calc(100vw-24px)]', lg:'w-[700px] max-w-[100vw]', auto:'w-auto max-w-none' }
```

Mirror `surface` (card/paper) on Sheet too.

## Drift inventory

### DialogContent

| file:line                                                     | drift                                                             | replacement                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ledger/.../LedgerHashComparison.tsx:32`                      | `max-w-[600px]`                                                   | `size="sm"`                                                                            |
| `global-search/.../GlobalSearchModal.tsx:39`                  | `max-h-[480px] p-0`                                               | `padding="none"`; keep `max-h-[480px]`                                                 |
| `proposers/UpsertProposer.tsx:203,241`                        | `p-0`                                                             | `padding="none"` ✅(footers already migrated in item A)                                |
| `proposers/DeleteProposerDialog.tsx:218`                      | `p-0`                                                             | `padding="none"`                                                                       |
| `hypernative/.../HnModal.tsx:18`                              | `max-w-[900px] overflow-auto rounded-2xl bg-[paper] p-0`          | `size="md" surface="paper" padding="none"`; `rounded-2xl` → radius variant/grandfather |
| `spaces/.../SafeSidebarWorkspaceHeader.tsx:66`                | `max-w-[420px] p-0`                                               | `padding="none"`; 420→`size="xs"` or add value                                         |
| `spaces/.../SelectSafeModal/index.tsx:80`                     | `flex max-h-[520px] flex-col gap-0 overflow-clip p-0`             | `padding="none"`; keep flex/max-h/overflow; drop `gap-0` (no-op)                       |
| `spaces/.../AddAccountsChooser/index.tsx:138`                 | `max-w-[440px] p-6 dark:border dark:border-border`                | `size="xs" padding="md"`; `dark:border` → surface/border variant/grandfather           |
| `spaces/.../SpaceInfoModal/index.tsx:113`                     | `max-w-[960px] gap-0 overflow-hidden border-0 p-0 sm:rounded-3xl` | `padding="none"`; 960→add/`md`; `border-0 sm:rounded-3xl` grandfather; drop `gap-0`    |
| `spaces/.../ImportAddressBookDialog.tsx:131`                  | `p-0`                                                             | `padding="none"`                                                                       |
| `counterfactual/.../CounterfactualSuccessScreen/index.tsx:62` | `px-12 py-20 gap-6`                                               | grandfather (bespoke centered success)                                                 |
| `safe-apps/PermissionsPrompt.tsx:30`                          | `p-0`                                                             | `padding="none"`                                                                       |
| `common/TrustedSafesModal/index.tsx:52`                       | `max-w-[min(900px,…)] gap-0 p-0`                                  | `size="md" padding="none"`; keep flex/max-h; drop `gap-0`                              |
| `common/TrustedSafesModal/SimilarityConfirmDialog.tsx:22`     | `max-w-[500px]`                                                   | **redundant (=default) → delete**                                                      |
| `common/TrustedSafesModal/SelectAllConfirmDialog.tsx:25`      | `max-w-[500px]`                                                   | **redundant → delete**                                                                 |
| `common/SpaceSafeBar/AccountsModal/index.tsx:137`             | `max-w-[560px] gap-0 p-0`                                         | `padding="none"`; 560→add value; drop `gap-0`                                          |

Clean (leave): `nested-safes/.../SimilarityConfirmDialog:34`, `tx-flow/.../DeleteTxModal:86`, `common/CopyTooltip/ConfirmCopyModal:29`, `common/ModalDialog:120` (→`size` after migration).

### SheetContent

| file:line                                | drift                                                                       | replacement                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `spaces/.../SecurityReportDrawer.tsx:74` | `inset-y-3! … w-[440px]! rounded-3xl border-0! bg-card p-0 shadow-xl gap-0` | `variant="floating" surface="card" size="md" padding="none"`; the `!` become unnecessary |
| `batching/.../BatchSidebar/index.tsx:76` | `z-[100] w-[700px] gap-0 rounded-l-2xl p-0`                                 | `size="lg" padding="none"`; `rounded-l-2xl` partial-float/grandfather; keep `z-[100]`    |
| `common/PageLayout/SideDrawer.tsx:75`    | `w-auto max-w-none border-0 p-0` (+tablet transparency)                     | `size="auto" padding="none"`; grandfather tablet transparency                            |
| `ui/sidebar.tsx:340`                     | `bg-sidebar w-(--sidebar-width) !border-r-0 p-0 [&>button]:hidden`          | grandfather (internal sidebar primitive)                                                 |

### DrawerContent

`safe-apps/SafeAppPreviewDrawer/index.tsx:44` `rounded-l-xl rounded-tr-none` → grandfather or Drawer radius variant.

### Header/Footer

- `border-b`/`border-t` → `divided`: ImportAddressBookDialog `132`/`151`, TrustedSafesModal `53`/`92`, AccountsModal `138`/`228` (`/50` → `divided="subtle"`).
- `flex-row items-center justify-between` (custom-close headers): DeleteProposerDialog `219`, UpsertProposer `204`,`244` → **grandfather (layout)**.
- Custom padding headers: SelectSafeModal `81` (`p-5 pb-0`), AddAccountsChooser `139` (`p-0 pb-3`), TrustedSafesModal `53` (`px-6 pb-4 pt-6`) → Header `padding` variant or grandfather.
- **DialogActions routing** (footer button rows not yet using the preset): AccountsModal `228` is two equal primary CTAs → **not** a DialogActions fit. (UpsertProposer/DeleteProposerDialog/ImportAddressBookDialog footers already migrated in item A.) SelectAllConfirmDialog `54` is skip/confirm — fits only if `onCancel`→skip acceptable.

### SheetHeader

`ui/sidebar.tsx:348` `sr-only` → grandfather (a11y).

## ESLint — LIVE (`dsDialogClassnameRule` in `eslint.config.mjs`)

Applied to `DialogContent, DialogHeader, DialogFooter, SheetContent, SheetHeader, SheetFooter, DrawerContent,
DrawerHeader, DrawerFooter`. Regex: `(?:^|\s)(p-|px-|py-|pt-|pb-|gap-|max-w-|w-\[|rounded-|bg-|border|shadow-)`
— catches padding, `max-w-*`, arbitrary `w-[…]`, gap, surface. Deliberately does NOT flag `max-h-*`, `w-full`,
`w-3/4`, flex/grid, or overflow (legit layout). `hover:`/`dark:`-prefixed utilities aren't caught either.

## Stories

dialog: `Sizes` (xs…xl), `Padding` (none vs md), `Surface`, `DividedHeaderFooter` (scrollable body), a `DialogFooter → DialogActions` canonical story. sheet: `Floating` (+card), `Sizes`, add a footer story with `divided`. drawer: `Radius`/direction story if a radius variant lands.

## Risk / decisions

- **Base UI (Dialog/Sheet) vs Vaul (Drawer)** — share a cva helper for Dialog↔Sheet only; Drawer positioning is direction-data-driven, keep separate.
- **`!` in SecurityReportDrawer** exist to beat base `data-[side]` classes; folding into `variant="floating"` removes the need — verify Tailwind order so floating wins without `!`.
- **`gap-0`**: no-op on DialogContent (no base gap) → drop; **load-bearing** on SheetContent (base `gap-4`) → keep. Don't blanket-remove.
- **Redundant `max-w-[500px]`** (Similarity/SelectAll confirm) = base default → just delete.
- **Odd widths** 420/440/560/700/960 don't map to `MAX_WIDTH_MAP` — snap to nearest (440→xs) needs design nod (pixel shift); grandfather until then.
- **ModalDialog is the linchpin** — applies width via inline `style` + CSS module (`min-width:600px`, `border-radius:24px`, fullscreen inline overrides). Only the `maxWidth` mapping moves to `size`; keep the fullScreen inline style.
- **`border-border/50`** softer divider — if `divided` standardizes on full `border-border`, AccountsModal shifts tone; provide `divided="subtle"`.
