# Badge / Chip family — sweep spec

> Executable handoff. Method: [`../DESIGN_SYSTEM_CONSISTENCY.md`](../DESIGN_SYSTEM_CONSISTENCY.md). Backlog item **C3**.

Primitives: `apps/web/src/components/ui/badge.tsx`, `chip.tsx` · MUI shim: `components/common/Chip/index.tsx` · Stories: `stories/badge.stories.tsx`, `chip.stories.tsx` · Test: `ui/chip.test.tsx` · Tokens: `styles/shadcn.css` (bridge), `styles/vars.css` (source)

> **Status — DONE.** Part 1 (commit `7002ceb07`) landed the `size`/`shape` axes, `info`/`positive`/`negative` on
> Badge, Chip semantic-colour parity, the `--color-info-*` bridge, and story docs. Part 2 (2026-07-10) took the
> deferred **design calls** and completed the family:
>
> - Every §3 drift site is migrated onto `variant`/`size`/`shape` props, accepting the `*-strong` shade shift
>   (FiatChange/status chips) and `TxStatusChip`/`Warning` moving to a `variant` map + `size="lg"` (text-sm).
>   `TxConfirmations` followed (its `backgroundColor` prop went away → `color="secondary"`).
> - Grandfathered (justified `// eslint-disable-next-line no-restricted-syntax`): `SafeGradeChip` `needs_attention`
>   (no `review` variant), `UnreadBadge` dot (no `shape="dot"`), `FiatChange` inline `px-0`. The MUI `Chip` shim
>   (inline `style`) and `ColorCodedTxAccordion` (css-module + runtime color-mix) carry plain explanatory comments
>   (the literal ESLint rule doesn't see `style`/`css.x`).
> - Dead css-module classes deleted: `AccountItem .chip`, `BalanceChanges .categoryChip`, `SafeAppTags
.safeAppTagLabel`, `ExecutionMethodSelector .notAvailableChip`.
> - The **Badge/Chip ESLint guard is live** (`dsBadgeClassnameRule`; regex adds `text-[…]` + `border`).
>
> Follow-up (not blocking): retire the MUI `Chip` shim once `SpaceSidebarNavigation`/`CsvTxExportButton` move to
> `<Badge>`/`<Chip>`; regenerate the stale `TxStatusChip`/`StakingStatus` Storybook snapshots
> (`yarn generate:storybook-tests`) — they're outside the `yarn test` gate.

## Current state

- **Badge** base bakes geometry: `h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium …`. `variant`: default/secondary/destructive/outline/warning/success/ghost/link. **No `size`.** Base UI `useRender`.
- **Chip** base: `inline-flex gap-1 rounded-4xl px-2.5 py-0.5 text-xs font-medium [&>svg]:size-3` (**no height**). `variant`: default/outline/primary. **No `size`.** Plain `<span>` + optional `onDelete` X.
- Divergence: Chip lacks Badge's semantic colours (warning/success/destructive) and ghost/link; neither has `size`; px differs (2 vs 2.5). This is accidental drift.

## Proposed additions

### Token prereq (`styles/shadcn.css` bridge block ~L146)

```css
--color-info-subtle: var(--color-info-background);
--color-info-strong: var(--color-info-dark);
```

### Shared `size` (both — pull `h-5 px-2 py-0.5 text-xs` OUT of base first)

```ts
size: {
  sm:'h-5 px-1.5 py-0 text-[10px] leading-none',
  default:'h-5 px-2 py-0.5 text-xs',
  lg:'h-6 px-2.5 py-0 text-sm',
  auto:'h-auto px-2.5 py-1 text-xs',
}
// defaultVariants size:'default' in BOTH; keep default/pill byte-identical to avoid global shift
```

### Chip → Badge colour parity (add to `chipVariants.variant`)

```ts
warning:'bg-warning-subtle text-warning-strong border-transparent',
success:'bg-accent-secondary text-accent-secondary-foreground border-transparent dark:bg-accent-secondary/20 dark:text-accent-success',
destructive:'bg-destructive/10 text-destructive border-transparent dark:bg-destructive/20',
info:'bg-info-subtle text-info-strong border-transparent',
```

Add `info` to Badge too. Add `positive`/`negative` to both (value chips): `positive:'bg-success-subtle text-success-strong border-transparent'`, `negative:'bg-destructive/10 text-destructive border-transparent dark:bg-destructive/20'`.

### `shape` axis (both — remove `rounded-4xl` from base)

```ts
shape: { pill:'rounded-4xl', tag:'rounded-sm' } // default pill
```

## Drift inventory (bare `text-xs` = default → remove)

### Chip

| file:line                                                  | drift                                                                                  | replacement                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `proposers/PendingDelegationsList.tsx:26`                  | `h-5 px-1 text-[11px] font-bold tracking-[1px] bg-[warning-light] text-[text-primary]` | `variant="warning" size="sm" className="font-bold tracking-[1px]"`                                                       |
| `myAccounts/.../AccountItemStatusChip.tsx:14`              | `css.chip` + inline bg info/warning                                                    | `variant="info"`(activating)/`"warning"`, `size="sm"`; drop style/css.chip                                               |
| `myAccounts/.../AccountItemStatusChip.tsx:31`              | `css.chip` + `text-[primary-light] border-[border-light]`                              | `variant="outline" size="sm"` (muted-outline nuance)                                                                     |
| `myAccounts/.../AccountItemQueueActions.tsx:19` (ChipLink) | inline bg `var(--color-${color}-background)`                                           | `variant="default"`/`"warning"`; drop `color` plumbing                                                                   |
| `tx/ConfirmTxDetails/NameChip.tsx:26`                      | `h-auto` + untrusted error / paper bg                                                  | `size="auto" variant={isUntrusted?'negative':'default'}`                                                                 |
| `tx/security/BalanceChanges/index.tsx:53,86`               | `css.categoryChip h-auto rounded-sm`                                                   | `size="auto" shape="tag"`; delete css                                                                                    |
| `tx/ExecutionMethodSelector/index.tsx:107`                 | `css.notAvailableChip` (bg-border-main h-5 rounded-md px-2)                            | `size="sm" shape="tag"` (or grey variant)                                                                                |
| `safe-apps/SafeAppTags/index.tsx:18`                       | `css.safeAppTagLabel` (rounded-[4px] h-6)                                              | `size="lg" shape="tag"`; delete css                                                                                      |
| `positions/.../PositionsHeader/index.tsx:30`               | `rounded-md bg-[bg-secondary] text-[text-primary]`                                     | `variant="default" shape="tag"`                                                                                          |
| `balances/AssetsTable/FiatChange.tsx:55`                   | `colorClass bgClass h-5/h-auto px-… pr-…`                                              | `variant={up?'positive':down?'negative':'default'} size={inline?'default':'auto'} className={inline?'px-0 pr-0':'pr-1'}` |
| `common/Chip/index.tsx:18` (MUI shim)                      | inline style                                                                           | **grandfather** — compat shim; migrate `SpaceSidebarNavigation/config.tsx:37`, `CsvTxExportButton:139` then delete       |

### Badge

| file:line                                           | drift                                                            | replacement                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `transactions/TxStatusChip/index.tsx:21`            | `h-6 rounded-2xl px-3 text-xs font-bold` + color→style map       | `variant` map (success/info/warning/destructive/default/secondary) + `size="lg"`; keep `font-bold`. (candidate to delete, use `<Badge>`) |
| `transactions/Warning/index.tsx:40`                 | `h-6 gap-1.5 px-2.5 py-0 text-xs`                                | `variant={severityBadgeVariant} size="lg" className="mb-2 gap-1.5 cursor-default"`; switch info map secondary→info                       |
| `spaces/.../AboutPage.tsx:220`                      | `h-6 px-2.5 text-sm font-mono`                                   | `variant="secondary" size="lg" className="font-mono"`                                                                                    |
| `spaces/.../ApiCtaSidebar.tsx:50`                   | `px-1 py-0 text-[10px] leading-none tabular-nums group-…:hidden` | `size="sm" className="tabular-nums group-data-[collapsible=icon]:hidden"`                                                                |
| `spaces/.../AllNetworksSection.tsx:112`             | `text-[10px] px-1.5`                                             | `variant="secondary" size="sm"`                                                                                                          |
| `spaces/.../MultiChainSafeItemRow.tsx:81`           | `text-xs whitespace-nowrap`                                      | `variant="secondary"` (drop — both base)                                                                                                 |
| `common/.../PinnedSafeItem.tsx:49`                  | `text-xs whitespace-nowrap`                                      | `variant="secondary"` (drop className)                                                                                                   |
| `spaces/.../SafeCardReadOnly.tsx:172`               | `text-xs`                                                        | `variant="secondary"` (drop)                                                                                                             |
| `proposers/TxProposalChip.tsx:11`                   | `text-primary gap-1`                                             | `variant="secondary"`, drop `text-primary` (or eslint-disable if intentional)                                                            |
| `spaces/.../SafeGradeChip.tsx:73`                   | `h-auto … px-2.5 py-1` + per-grade ramp                          | `size="auto"` + local map w/ 1 eslint-disable (`needs_attention` has no variant; add `review` variant or grandfather)                    |
| `tx/ColorCodedTxAccordion/index.tsx:88`             | `css.methodChip` runtime color-mix                               | **grandfather** (runtime color, not a fixed variant)                                                                                     |
| `common/UnreadBadge/index.tsx:29`                   | `px-1 h-5` + dot state `size-2 rounded-full p-0`                 | `size="sm"` + keep positioning; dot → `shape="dot"` or grandfather (notification indicator)                                              |
| `common/TrustedSafesModal/SimilarityWarning.tsx:18` | `border-yellow-300 text-yellow-800 dark:…`                       | `variant="warning" className="cursor-help"` (drop raw yellow)                                                                            |

No-drift Badge sites (leave): SafeCardLayout:77, SafeCardReadOnly:111, ThresholdBadge:5, WorkspaceBanner:21, AccountWidgetItem:60, PendingTxWidget:92, MembersList:135/136/169, RequestToAddButton:97, SpaceAddressBook:173, PendingRequestsTable:118/144/189, PendingTxList:92.

## ESLint — LIVE (`dsBadgeClassnameRule` in `eslint.config.mjs`)

Applied to `Badge`, `Chip`. Regex is the button set plus `text-[` and `border`:
`(?:^|\s)(h-|px-|py-|text-(xs|sm|base|lg)|text-\[|rounded-|bg-|border)` — so it catches `text-[10px]`,
`text-[var(--…)]`, and `border-*` colour utils that the plain button regex missed. `w-*`, margins, flex/grid,
and `hover:`/`dark:`-prefixed utilities stay allowed. Note the rule only sees `className` string literals — the
MUI `Chip` shim (inline `style`) and `ColorCodedTxAccordion` (`className={css.x}`) aren't caught, so they carry
plain explanatory comments instead of a disable directive.

## Stories

badge: add `info` (+positive/negative) to options, `size` (sm/default/lg/auto) argType, `shape` (pill/tag) argType; add Sizes/Shapes/Icon sections. chip: add warning/success/destructive/info/positive/negative options, size+shape argTypes; add colour variants, `size="auto"` (EthHashInfo like NameChip), positive/negative pair (+4.31%/-2.10%), `shape="tag"`. Update `ui/chip.test.tsx` with variant/size/shape assertions.

## Risk / order

- **Land in order:** token bridge + cva additions FIRST (non-breaking, defaults preserved) → drift replacements → ESLint LAST (else CI red-walls unconverted sites mid-migration).
- Keep Badge `default`/`pill` byte-identical when moving `h-5 text-xs rounded-4xl` into size/shape — ~40 call sites depend on it.
- Grandfather: ColorCodedTxAccordion (runtime color-mix), SafeGradeChip `needs_attention` (review-\* tokens, no variant), UnreadBadge dot, MUI Chip shim.
- FiatChange/status use `*-main`; `*-strong`(=`-dark`) is a slightly deeper shade — design sign-off before collapsing into positive/negative/info.
- **Keep Chip + Badge as two primitives, share the cva axes** (extract a shared `pillVariants` or have chipVariants compose badgeVariants; converge base padding). Full merge is higher-risk (Base UI `useRender` vs `<span>`, onDelete API) for little gain.
