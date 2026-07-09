# Select family — sweep spec

> Executable handoff. Method: [`../DESIGN_SYSTEM_CONSISTENCY.md`](../DESIGN_SYSTEM_CONSISTENCY.md). Backlog item **C5**.

Primitive: `apps/web/src/components/ui/select.tsx` · Sizing sibling: `input.tsx` · Story: `stories/select.stories.tsx`

## Current state

**No cva today.** Sizing via a `data-size` attr + `data-[size=…]` utilities in one `cn()` string. `SelectTrigger` has `size?: 'sm'|'default'` (+ `iconWrapperClassName`); base `border border-border rounded-md bg-transparent px-3 py-2 text-sm shadow-xs`, `data-[size=default]:h-9 data-[size=sm]:h-8`. **`SelectContent` is already clean** (positioning props only; call-site overrides are layout-only `min-w`/`max-h`). Only `SelectTrigger` carries drift.

## Proposed — `SelectTrigger` cva (mirror input.tsx; keep rendering `data-size`)

```ts
import { cva, type VariantProps } from 'class-variance-authority'
const selectTriggerVariants = cva(
  // structure + a11y only (NOT height/padding/skin)
  'flex w-fit items-center justify-between gap-2 whitespace-nowrap text-sm outline-none transition-[color,box-shadow] ' +
    'data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ' +
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-[3px] ' +
    'disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 ' +
    '*:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:line-clamp-1 ' +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border border-border rounded-md bg-transparent px-3 py-2 shadow-xs dark:bg-input/30 dark:hover:bg-input/50',
        surface: 'border border-border rounded-lg bg-card px-3 py-2 shadow-none dark:bg-card',
        ghost:
          'border-0 rounded-md bg-transparent px-0 py-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent',
      },
      size: { sm: 'h-8', default: 'h-9', lg: 'h-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
// SelectTrigger: add `variant`, keep `size`, keep data-size={size}, className={cn(selectTriggerVariants({variant,size}), className)}
```

## Drift inventory — SelectTrigger

| file:line                                                                                                               | drift                                                                               | replacement                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spaces/.../ActivityLogFilters.tsx:106`                                                                                 | `bg-card dark:bg-card w-48 rounded-lg`                                              | `variant="surface" className="w-48 cursor-pointer"`                                                                                                                                               |
| `spaces/.../ActivityLogFilters.tsx:148`                                                                                 | `bg-card dark:bg-card w-40 rounded-lg`                                              | `variant="surface" className="w-40 cursor-pointer"`                                                                                                                                               |
| `spaces/.../MemberInviteRow.tsx:167`                                                                                    | `rounded-lg bg-card data-[size=default]:h-11`                                       | `variant="surface" className="min-w-[120px] cursor-pointer data-[size=default]:h-11"` (h-11=44 grandfathered)                                                                                     |
| `spaces/.../SafeSelectorDropdown/index.tsx:120`                                                                         | `border-0 shadow-none bg-transparent … -m-4 pl-6 …`                                 | `variant="ghost"` + keep `-m-4 flex-1 pl-6 focus-visible:ring-0 focus-visible:border-0 [&_[data-slot=select-value]]:pr-0 relative` + `variants.triggerClass`                                      |
| `common/NetworkSelector/index.tsx:356` (+css.select)                                                                    | `bg:transparent border:none box-shadow:none padding:0 height:100%`                  | default path `variant="ghost" className={cn(triggerClassName ?? 'h-full')}`; delete `.select`                                                                                                     |
| `spaces/.../AddManually.tsx:104`                                                                                        | `h-full w-full border-0 bg-transparent px-0 shadow-none`                            | `variant="ghost" className="h-full w-full"`                                                                                                                                                       |
| `new-safe/load/.../SetAddressStep/index.tsx:39` → NetworkSelector `triggerClassName` (`largeFormFieldSurfaceClassName`) | `min-h-[66px] h-[66px] rounded-… border-border bg-card px-4 shadow-none`            | `variant="surface"`; keep `min-h-[66px] h-[66px] px-4` in the shared constant (also used by OwnerRow — don't migrate blindly)                                                                     |
| `safe-apps/SafeAppsFilters/index.tsx:68` (+css.fieldControl)                                                            | `height:40px!important border bg-card box-shadow:none`                              | `size="lg" variant="surface" className="w-full"`; delete `.fieldControl`/`filterFieldClassName`                                                                                                   |
| `balances/CurrencySelect/index.tsx:28`                                                                                  | `size=sm` + `min-w-[72px] border-border bg-background px-3 font-medium shadow-none` | keep `size="sm"`; `className="min-w-[72px] bg-background font-medium shadow-none"` (drop redundant border-border/px-3/focus); **`bg-background`+`shadow-none` flat look ≠ surface — flag design** |
| `spending-limits/.../CreateSpendingLimit/index.tsx:87`                                                                  | `font-bold`                                                                         | **grandfather** (font-weight, out of token set)                                                                                                                                                   |
| `common/SignerSelector/index.tsx:32` (css.signerForm)                                                                   | `border: border-light !important`                                                   | **grandfather** (no token-matching variant); keep `w-full`                                                                                                                                        |
| `safe-apps/SafeAppLandingPage/AppActions.tsx:104`                                                                       | `min-h-[56px] w-[311px]`                                                            | **grandfather** (56px no matching size)                                                                                                                                                           |

### Other subcomponents

- `CurrencySelect:51` (SelectItem) `min-h-10 rounded-lg px-3 py-2.5 pr-9` — out of Trigger scope; grandfather or item-variant program.
- `SafeAppsFilters:76,82` (SelectItem) `text-sm` — **redundant** (base has it) → drop.
- `NetworkSelector:315` (SelectItem css.menuItem `padding:0`) — grandfather (nav-link).
- `NetworkInput:28`, `SafeAppsFilters:69` (SelectValue placeholder color) — layout / likely redundant with `data-[placeholder]`.
- SelectContent overrides (NetworkSelector:363 `min-w-[260px]`, CurrencySelect:44 `max-h-80 min-w-[140px]`) — layout, no-op.

Layout-only SelectTriggers (do NOT touch): MemberInfoForm:20, FeeTokenPreference:291, SetupNestedSafe:207, UpsertRecoveryFlowSettings:185/258, CsvTxExportModal:205, NetworkInput:52, AdvancedOptionsStep:131; no-className: SignersStructureView:139, ChooseOwner:141, SetThreshold:69, RecoverAccountFlowSetup:157, ChooseThreshold:74, OwnerPolicyStep:155, TokenAmountInput:173.

## ESLint

Add `SelectTrigger`. **Regex caveats:** won't match `min-h-`/`min-w-` (AppActions 56px, formFieldStyles 66px), won't match modifier-prefixed `data-[size=default]:h-11` (MemberInviteRow — but its `bg-card`/`rounded-lg` WILL flag), won't see css-module drift (fieldControl/select/signerForm — migrate manually).

## Story

`stories/select.stories.tsx` has `AllVariants` (Sizes/States/Groups/Separator). Add a **Variants** section (default/surface/ghost side by side) and extend Sizes with `size="lg"`. Pattern: `<Select defaultValue items={OPTION_ITEMS}><SelectTrigger …>…</SelectTrigger><SelectContent>…</SelectContent></Select>`.

## Risk

- **No cva today** → structural change; `variant="default"` MUST stay byte-identical. Padding pushed into variants (px-3 vs px-0 conflict) since cva concatenates and only the outer `cn()` tw-merges.
- **`data-size` still consumed** by call-site overrides (MemberInviteRow `data-[size=default]:h-11`) and CSS modules using `!important` to beat it (SafeAppsFilters). Keep rendering `data-size`.
- **Shared `formFieldStyles.ts` constants** consumed beyond Select (OwnerRow, load flow, AddressInput 66px). `variant="surface"` migration of NetworkSelector must not regress non-Select consumers.
- **Grandfather:** CreateSpendingLimit `font-bold`, SignerSelector `border-border-light`, AppActions/formFieldStyles bespoke heights, CurrencySelect `bg-background`+`shadow-none` flat look, SafeSelectorDropdown `-m-4 pl-6`+ring-suppression.
- `native-select.tsx` (`NativeSelect`, pagination in EnhancedTable) is a **sanctioned** native primitive, not drift — keep sm/default in sync if adding `lg`. `SafeSelectorDropdown` tests mock SelectTrigger/Content and spread className — adding `variant` is backward-compatible.
