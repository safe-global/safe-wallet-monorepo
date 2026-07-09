# Card family — sweep spec

> Executable handoff. Method & rules: [`../DESIGN_SYSTEM_CONSISTENCY.md`](../DESIGN_SYSTEM_CONSISTENCY.md),
> [`../../.storybook/AGENTS.md`](../../.storybook/AGENTS.md). Backlog item **C1**.

Primitive: `apps/web/src/components/ui/card.tsx` · Story: `apps/web/src/components/ui/stories/card.stories.tsx`

## Current state (NOT cva)

Hand-rolled `cn()` strings; `size` (`'default' | 'sm'`) is a `data-size` attr on the root + `group-data-[size=sm]/card:*` selectors on slots. **No `variant` prop.** Exports: `Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent`.

- Root: `bg-card text-card-foreground gap-6 py-6 rounded-xl overflow-hidden text-sm flex flex-col group/card`. **No border, no shadow** (removed 2026-01-29). `size=sm` → `gap-4 py-4`.
- Vertical padding (`py-*`) + `gap-*` on **root**; horizontal (`px-6`, `sm:px-4`) on **slots** (Header/Content/Footer).
- **`border-0`, `shadow-none`, `bg-card` at call sites are dead no-ops → just delete them.**

## Proposed cva (convert root; keep `data-*` attrs so slots stay reactive)

```ts
const cardVariants = cva(
  'bg-card text-card-foreground group/card flex flex-col overflow-hidden text-sm ' +
    'has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
  {
    variants: {
      variant: {
        default: '',
        outlined: 'border border-border', // re-adds the hairline many sites hand-roll
        muted: 'bg-muted', // inset/preview surfaces (decoded tx lists)
      },
      size: {
        default: 'gap-6 py-6',
        sm: 'gap-4 py-4',
        none: 'gap-0 py-0', // "flush": kills internal spacing
      },
      radius: { lg: 'rounded-lg', xl: 'rounded-xl', none: 'rounded-none' },
    },
    defaultVariants: { variant: 'default', size: 'default', radius: 'xl' },
  },
)
```

Root must emit `data-variant` and keep `data-size`. Add to Header/Content/Footer, mirroring the `sm` pattern: `group-data-[size=none]/card:px-0`.

**Do NOT add** a separate `plain`/`flush` variant — border/shadow are already default-absent, so "flush" == spacing removal == `size="none"`.

## Drift inventory (`border-0`/`shadow-none`/`bg-card` = delete no-op)

| #   | file:line                                                | classify                       | replacement                                                                                                         |
| --- | -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1   | `balances/AssetsTable/index.tsx:249`                     | size-none + grandfather        | `size="none" className="mb-4 border-4 border-transparent"` (border-4 = hover-outline spacer)                        |
| 2   | `balances/AssetsTable/index.tsx:290`                     | same as 1                      | same                                                                                                                |
| 3   | `safe-apps/NativeSwapsCard/index.tsx:23`                 | safe-fix                       | `size="none" className="h-full transition-colors hover:bg-muted"`                                                   |
| 4   | `global-search/.../GlobalSearchModal.tsx:40`             | mixed                          | `size="sm" className="max-h-[480px]"`; **`gap-2`≠sm `gap-4`** — confirm w/ design or keep `gap-2` w/ eslint-disable |
| 5   | `spaces/.../SpaceSettingsSection.tsx:7` (preset)         | preset                         | `as="section" size="none"`; keep `rounded-2xl p-6` (preset design)                                                  |
| 6   | `earn/.../EarnInfo/index.tsx:78`                         | needs `p-8`                    | wrap body in `CardContent`+`size="lg"` (see decision) OR grandfather                                                |
| 7   | `earn/.../EarnInfo/index.tsx:109`                        | same as 6                      | same                                                                                                                |
| 8   | `earn/.../EarnInfo/index.tsx:179`                        | `p-4`                          | wrap in `CardContent className="p-4"` or grandfather                                                                |
| 9   | `spaces/.../SpacesList/index.tsx:146`                    | `p-10` outlier                 | grandfather; keep `w-full text-center`                                                                              |
| 10  | `recovery/.../RecoveryInProgressCard.tsx:86`             | radius-decision + `gap-8`      | `className={cn(css.card,'gap-8')}` (radius per decision)                                                            |
| 11  | `recovery/.../RecoveryProposalCard.tsx:82`               | same as 10                     | keep `data-testid`                                                                                                  |
| 12  | `spaces/.../WorkspaceHealthCard.tsx:120`                 | `gap-6`(=default→drop) + `p-6` | `className="mb-6 items-start p-6 md:flex-row md:items-center"`                                                      |
| 13  | `spaces/.../WorkspaceHealthCard.tsx:138`                 | `py-5 px-6` custom             | grandfather padding; drop `gap-6`                                                                                   |
| 14  | `spaces/.../SecurityDrawerChecks.tsx:57`                 | row preset                     | `size="none"` + grandfather `px-4 gap-3 dark:bg-secondary h-[88px]`                                                 |
| 15  | `spaces/.../UserSettings/index.tsx:31`                   | same as 6                      | `p-8`                                                                                                               |
| 16  | `tx-flow/flows/ExecuteBatch/DecodedTxs.tsx:23`           | safe-fix                       | `variant="muted" size="none" className="mt-2"`                                                                      |
| 17  | `tx-flow/flows/ExecuteBatch/DecodedTxs.tsx:24` (Content) | grandfather                    | `p-2` list padding; keep `flex divide-y`                                                                            |
| 18  | `tx-flow/features/RiskConfirmation.tsx:29`               | surface-decision               | `size="none" className="bg-[var(--color-background-main)] px-2"` (see dark-mode note)                               |
| 19  | `transactions/.../Multisend/index.tsx:123`               | safe-fix                       | `variant="muted" size="none" className="mt-2"`                                                                      |
| 20  | `transactions/.../Multisend/index.tsx:124` (Content)     | grandfather                    | `p-2`                                                                                                               |
| 21  | `tx-flow/common/TxCard/index.tsx:12`                     | safe-fix + structural          | `variant="outlined" size="none" className="txCardRoot my-4 rounded-b-xl border-t-0"`                                |
| 22  | `tx-flow/common/TxCard/index.tsx:13` (Content)           | drop `px-0`                    | `size="none"` yields px-0; `className={css.cardContent}`                                                            |
| 23  | `transactions/.../SingleTxDecoded/index.tsx:118`         | safe-fix                       | `size="none"`                                                                                                       |
| 24  | `settings/SettingsCard/index.tsx:21` (preset)            | preset                         | `size="none" className={cn('rounded-lg p-8', className)}`                                                           |
| 25  | `transactions/BulkTxListGroup/index.tsx:44`              | safe-fix + `py-2`              | `data-testid="grouped-items" size="none" className={cn(css.container,'py-2')}`                                      |
| 26  | `transactions/.../NestedTransaction.tsx:40`              | surface-decision               | `variant="outlined" size="none" className="bg-[var(--color-background-main)]"` (+radius/surface)                    |
| 27  | `transactions/.../NestedTransaction.tsx:66` (Content)    | grandfather                    | `p-4`                                                                                                               |
| 28  | `safe-apps/AddCustomSafeAppCard/index.tsx:16`            | safe-fix                       | `size="none"`                                                                                                       |
| 29  | `spaces/.../SpaceCardNew/index.tsx:52`                   | grandfather                    | keep grid; `gap-2 p-4` custom layout (`size="sm"` retained)                                                         |
| 30  | `spaces/.../WorkspaceBanner/index.tsx:14`                | safe-fix + banner              | `variant="outlined" size="none" className={cn('w-full rounded-lg px-4 py-3 shadow-[…]',css.banner,className)}`      |
| 31  | `safe-apps/SafeAppCard/index.tsx:162`                    | safe-fix                       | `size="none" className={classNames(css.safeAppContainer,className)}`                                                |
| 32  | `hypernative/.../HnActivatedSettingsBanner.tsx:12`       | same as 6                      | `p-8`                                                                                                               |
| 33  | `safe-apps/SafeAppLandingPage/index.tsx:63`              | `p-12` outlier                 | grandfather                                                                                                         |
| 34  | `transactions/TxDetails/index.tsx:271`                   | safe-fix                       | `size="none" radius="none"` when `contrastSurface`; `bg-transparent` in className                                   |
| 35  | `new-safe/create/InfoWidget/index.tsx:46`                | safe-fix                       | `variant="outlined" className={styles.card}`                                                                        |

Story/test files (lower priority): `ManageTokensButton/index.stories.tsx:41,90` + Content `:42,91`; `Warning/Warning.stories.tsx:11,12`; `TotalValueElement.stories.tsx:32` (clean), `:33` (pt-6).

**CSS-module Card usages** (ESLint literal rule won't see these — separate pass): `ColorCodedTxAccordion:77` (css.item), `SafeAppSocialLinksCard:33`, `dashboard/FirstSteps:47,273`, `new-safe/CardStepper:17` (no-op), `new-safe/create/OverviewWidget:32` (→outlined), `myAccounts/.../DataWidget:42,43`, `SecurityEmptyState:25`, RecoveryCards, `TxDetails/index.tsx:270`.

## ESLint (`dsButtonClassnameRule` in `eslint.config.mjs`)

Add: `Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, CardAction` + presets `SettingsCard, SpaceSettingsSection, TxCard`.

**Regex caveat:** current selector matches only `h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-`. Card's dominant drift is `gap-`, `border`, `shadow-`, full-side `p-`. Extend to e.g. `(?:^|\s)(h-|p-|px-|py-|pt-|pb-|gap-|text-(xs|sm|base|lg)|rounded-|bg-|border(?![-\w])|border-|shadow-)` (keep `w-*`/margins/flex-grid allowed). `border-0`/`shadow-none`/`bg-card` will then correctly flag as removable no-ops.

## Story updates

Add "Variants" (default/outlined/muted), "Flush/size" (`size="none"` next to default/sm, nested `CardContent` owns padding), "Radius" row if adopted, and a "when to use which" doc block mirroring the Button story; state `className` is layout-only.

## Decisions needed (design nod)

- **Radius default flip `xl`→`lg`** (matches ~5 sites + legacy MUI 8px) — global visual change; spec keeps `xl` coded, exposes `radius` axis. Decide before rows 10,11,24,26,30.
- **`p-8` cluster** (EarnInfo×2, UserSettings, Hypernative): add `size="lg"` (`gap-8 py-8` + `group-data-[size=lg]/card:px-8`) **and** wrap bodies in `CardContent`, OR grandfather. Recommend `lg` for `p-8`, grandfather `p-10`/`p-12`.
- **Dark-mode surface tokens differ** — `--card` #171717 (default) vs `--color-background-paper` #1c1c1c vs `--color-background-main` #121312. Do NOT swap `bg-[--color-background-main]`→`bg-muted` on NestedTransaction/RiskConfirmation without checking nested-vs-outer contrast in dark. Grandfather until a `surface` variant is signed off.

**Non-breaking path (no design nod):** add the cva (defaults byte-identical), migrate only the no-op deletes + `size="none"`/`outlined`/`muted` safe-fixes, grandfather the radius/surface/`p-8` sites, document, extend ESLint.
