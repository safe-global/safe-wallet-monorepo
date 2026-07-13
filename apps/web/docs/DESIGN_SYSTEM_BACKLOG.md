# Design-system consistency — remaining work & handoff

Self-contained worklist for continuing the button/primitive consistency effort on
`feat/shadcn-migration` (PR #8040). Each item below can be picked up **independently and in
parallel**. Read §1 once, then jump to any item in §3.

> Companion docs: **method & rationale** → [`DESIGN_SYSTEM_CONSISTENCY.md`](./DESIGN_SYSTEM_CONSISTENCY.md);
> **authoring-time rules** → [`../.storybook/AGENTS.md`](../.storybook/AGENTS.md) ("Component variants over custom styling").

---

## 1. Context (read first)

**The rule.** On a design-system primitive, `className` is **layout-only** (`w-*`, margins, flex/grid).
Height, padding, font-size, radius, background belong to `size`/`variant` props. Overriding them via
className is "drift".

**Enforcement in place.**

- **ESLint** `no-restricted-syntax` in `apps/web/eslint.config.mjs` (`dsButtonClassnameRule`) flags
  `h-*`/`px-*`/`py-*`/`text-xs|sm|base|lg`/`rounded-*`/`bg-*` on `<Button>`/`<SubmitButton>`/`<ActionButton>`.
  Runs on every PR via `web-checks.yml`. **Extend it per family** as each closes (add the element name).
- **Closed presets** in `components/common/` `Omit` `className`/`size` from their types → drift is a _compile
  error_, not just lint. This is the strongest guard; prefer it for new presets.

**The method (repeat per family):** recon the primitive's cva → audit call sites for drift → add
variants/sizes for recurring patterns → document them in the family's story → migrate call sites (safe-fixes;
grandfather structural exceptions with a justified `// eslint-disable-next-line no-restricted-syntax -- <reason>`)
→ verify → the ESLint rule + Argos guard it.

**Verify every change:** `yarn workspace @safe-global/web type-check` · `npx eslint <files>` (from `apps/web`) ·
`yarn workspace @safe-global/web test --testPathPattern "<area>"` · `npx prettier --write <files>` ·
spot-check the story in Storybook light+dark.

---

## 2. Done — do NOT redo

- **Button** — app-wide sweep (44 overrides → `size`/`variant`); variants `action`, `submit`, `xl`, `surface`,
  `destructive-outline`; the closed presets **`SubmitButton`, `ActionBar`+`ActionButton`, `DialogActions`,
  `OnboardingFooter`, `IconAction`** (`components/common/`); ESLint guard; `UI/Button → Guidelines` story.
- **Tabs** — `segmented` variant + `cursor-pointer` baked into base; the welcome **Accounts/Workspaces toggle**
  converted onto the primitive (`AccountsNavigation`), CSS module deleted.
- **DialogActions rollout** — 19 dialog footers migrated; then (**item A**) extended with
  `confirmCheckWallet` + `confirmTooltip` props and Cancel pinned to `type="button"`, and 4 more
  footers routed through it (DeleteProposerDialog, UpsertProposer ×2, ImportAddressBookDialog,
  SafeListRemoveDialog).
- **tx re-ports** — `ExecutionMethodSelector` (GTF relay-counter gate) + `TxDetails/Summary` (tx-hash row + GTF
  history-fees). Money-movement tx files audited vs `dev`: **money logic byte-identical**; only display deltas.
- **Select (C5)** — `SelectTrigger` `variant` axis (default/surface/ghost) + `lg` size (cva; `default`
  byte-identical, height still on `data-size`). Migrated ActivityLogFilters ×2 + MemberInviteRow → surface,
  AddManually → ghost; CurrencySelect/SafeSelectorDropdown grandfathered. ESLint extended to `<SelectTrigger>`;
  `UI/Select` story documents the variants. (CSS-module drift — SafeAppsFilters/NetworkSelector/SignerSelector —
  left as a follow-up per the spec; the rule doesn't see css-module classes.)
- **Badge/Chip (C3) — DONE:** part 1 added `size` (sm/default/lg/auto) + `shape` (pill/tag) axes,
  `info`/`positive`/`negative` on Badge, Chip semantic-colour parity, the `--color-info-*` bridge, stories.
  Part 2 (this pass) took the design calls: all ~24 drift sites migrated onto `variant`/`size`/`shape` (accepting
  the `*-strong` shade shift + `TxStatusChip`/`Warning`→variant-map/`lg`), bespoke sites grandfathered
  (SafeGradeChip `needs_attention`, UnreadBadge dot, FiatChange inline px-0), 4 dead css-module classes deleted,
  and the **Badge/Chip ESLint guard is live** (`dsBadgeClassnameRule`; regex adds `text-[…]`+`border`). Follow-up:
  retire the MUI `Chip` shim; regenerate stale TxStatusChip/StakingStatus Storybook snapshots.
- **Input/InputGroup (C4) — DONE:** part 1 added `variant` (`default`/`surface`) + `inputSize="xl"` (66px) on
  `Input`/`InputGroup`, the shared `SearchInput` preset, `NumberField`/`NameInput` pass-through, and safe
  search + 66px migrations. Part 2 (this pass) closed the tail: outliers resolved (`ActivityLogFilters`,
  `CreateSpaceOnboarding`, `MemberInviteRow` → `variant="surface"`; `NftGrid`/`SidebarInput`/`InputGroupInput`
  grandfathered — no one-off variants), and the **Input ESLint guard is live** (`dsInputClassnameRule` for
  `Input`/`InputGroup*` + presets `SearchField`/`SearchInput`/`NumberField`/`NameInput`). Follow-up: fully
  retire `SearchField` onto `<SearchInput>`; `AddressInput` MUI holdover out of scope.
- **Dialog/Drawer/Sheet (C2) — DONE:** `DialogContent` gained cva `size` (MAX_WIDTH_MAP), `padding`, `surface`;
  `SheetContent` gained `variant="floating"`/`size`/`surface`/`padding`; Header/Footer gained `divided`
  (+`subtle`). Defaults byte-identical. `ModalDialog` passes token widths via `size=` (arbitrary widths + full
  screen keep inline style). Call sites migrated; odd widths + bespoke paddings grandfathered; Dialog/Sheet/Drawer
  ESLint guard (`dsDialogClassnameRule`) live. **Caveat:** Sheet `size` is a no-op for left/right sheets (base
  `data-[side]` specificity wins) — 3 real sheets unchanged (zero regression); making it functional is a design
  follow-up. Drawer unchanged (SafeAppPreviewDrawer radius grandfathered).
- **Card (C1) — DONE:** part 1 added cva `variant` (`default`/`outlined`/`muted`), `size` (`sm`/`default`/`lg`/`none`),
  and `radius` (`lg`/`xl`/`none`). Part 2 (this pass) took the **design calls**: added `size="lg"` (32px, replaces the
  `p-8` cluster via `size="lg"`+`CardContent`), **flipped the default radius `xl`→`lg`** app-wide (8px, MUI parity),
  and unified GlobalSearch `gap-2`→`gap-4`. Every remaining literal drift site is migrated or carries a justified
  `// eslint-disable-next-line no-restricted-syntax` grandfather, and the **Card-family ESLint guard is live**
  (`dsCardClassnameRule` for `Card`+slots+presets `SettingsCard`/`SpaceSettingsSection`/`TxCard`; wider regex incl.
  `gap-`/`border`/`shadow-`/full `p-`). Story documents all axes + a layout-only guidance block. **Needs Argos/visual
  QA** to confirm the app-wide radius flip; a few sites may want `radius="xl"` back. CSS-module Card usages
  (see spec) are a separate follow-up — the literal ESLint rule can't see them.

---

## 3. Remaining work (each item is independent — parallelize freely)

| #      | Item                                                                                                                             | Effort | Blocked by                            | Kind  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------- | ----- |
| ~~A~~  | ~~Finish `DialogActions` + skipped footers~~ — **DONE** (item A)                                                                 | —      | —                                     | code  |
| ~~B~~  | ~~On-colour CTA decision~~ — **DONE** (Earn/AddFunds/AccountHeader → `variant="surface"`, disables removed)                      | —      | Argos to confirm AccountHeader shift  | code  |
| ~~C1~~ | ~~**Card** family tail + ESLint~~ — **DONE** (design calls taken: `size="lg"`, radius default `xl`→`lg`, gap unify; ESLint live) | —      | Argos to confirm the radius flip      | code  |
| ~~C2~~ | ~~**Dialog/Drawer/Sheet** family~~ — **DONE** (cva size/padding/surface/divided; ESLint live)                                    | —      | Argos; Sheet `size` design follow-up  | code  |
| ~~C3~~ | ~~**Badge/Chip** migration + ESLint~~ — **DONE** (design calls taken; ~24 sites migrated; ESLint live)                           | —      | Argos to confirm shade/size shifts    | code  |
| ~~C4~~ | ~~**Input/InputGroup** tail + ESLint~~ — **DONE** (outliers → `surface`/grandfather; ESLint live)                                | —      | Argos; retire `SearchField` follow-up | code  |
| ~~C5~~ | ~~**Select** family~~ — **DONE** (literal-className sites; css-module sites follow-up)                                           | —      | —                                     | code  |
| ~~D~~  | ~~Sweep up the grandfathered button disables~~ — **CLOSED** (CTA trio removed via B; rest kept as sanctioned exceptions)         | —      | ButtonGroup primitive = future work   | code  |
| E      | Turn on the Argos visual gate on PRs                                                                                             | S      | **repo secret**                       | infra |
| F      | Migration PR's own un-draft items (not the DS thread)                                                                            | —      | —                                     | QA    |

Items **C1–C5** are fully independent and can run concurrently (disjoint files, except each extends the one
shared `eslint.config.mjs` — do the ESLint edit last, or have the worker report the element name for a single
consolidated edit). **B** and the design-y parts of **D** need a design decision first. **E** needs a secret. Do
**not** run two workers on the same family.

### A. Finish DialogActions + the skipped footers — DONE

`DialogActions` gained **`confirmCheckWallet`** (`boolean | CheckWallet options`; wraps the confirm in
`<CheckWallet>` and ORs `!isOk` into disabled) and **`confirmTooltip`** (business-logic explainer, independent of
wallet state), and its Cancel button is now `type="button"` (never submits a surrounding form). Migrated:
`proposers/DeleteProposerDialog` (both branches), `proposers/UpsertProposer` (both branches),
`SpaceAddressBook/Import/ImportAddressBookDialog` (tooltip case), `common/SafeListRemoveDialog` (Track → inline
`trackEvent`). **`recovery/CancelRecoveryButton` was mislisted** — it is a standalone single button, not a
cancel/confirm footer; left as-is. **Still left** (genuinely not a cancel/confirm pair): `SpaceSafeBar/AccountsModal`
(two equal primary CTAs), `TrustedSafesModal/SelectAllConfirmDialog` (skip/confirm), `new-safe/.../SetNameStep`
(wizard nav).

### B. On-colour CTA (needs a design nod, then trivial)

The `surface` variant (`bg-card` + border + shadow) already exists on `button.tsx`. Three CTAs sit on coloured
surfaces and carry justified disables: `dashboard/AddFundsBanner`, `earn/.../EarnButton`,
`safe-overview/.../AccountHeader`. **Decision needed:** they use `--color-background-paper` (identical to `--card`
in light, `#1c1c1c` vs card `#171717` in dark) and some add a border. Confirm with design whether to unify onto
`variant="surface"` (a tiny dark-mode shift + a border) or keep. If yes → swap to `variant="surface"`, delete the
disables. `StakeButton` is already migrated (zero-change reference).

### C. Per-primitive family sweeps

> **Each family now has a full executable spec** in [`design-system/`](./design-system/) — exact cva additions,
> a per-file drift table (`file:line | classify | replacement`), ESLint element names + the regex-extension
> caveat, story additions, and the design decisions to confirm. Start there; the table below is just the index.

For each: **recon** the primitive's cva, **add the missing variants/sizes** (below), **document** them in the
family's `components/ui/stories/*.stories.tsx`, **migrate** the drifting call sites, **extend the ESLint rule** to
the primitive, **verify**. Drift counts + starting files from the audit:

| Family                              | Drift                                                                                                                                                                                                                                                              | Add these variants/sizes                                                                                                | Start-here files |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| ~~**C1 Card**~~ (DONE)              | Complete. `size="lg"` added, radius default flipped `xl`→`lg`, GlobalSearch gap unified; all drift migrated or grandfathered; ESLint guard live. Only follow-ups: Argos confirmation of the flip + the CSS-module Card pass (see spec).                            | Final axes: `variant="outlined"/"muted"`, `size="sm"/"lg"/"none"`, `radius="lg"/"xl"/"none"`.                           | — (done)         |
| **C2 Dialog/Drawer/Sheet** (33/50)  | Content `padding` prop (`none` clears ~16 sites), Header/Footer `divided` (border), Content `size` width scale (map the `MAX_WIDTH_MAP` in `ModalDialog`), Sheet `variant="floating"`, Content `surface` (card/paper). Footer rows → route through `DialogActions` | `SecurityReportDrawer`, `TrustedSafesModal`, `proposers/UpsertProposer`, `hypernative/HnModal`, `batching/BatchSidebar` |
| ~~**C3 Badge/Chip**~~ (DONE)        | Complete. Primitives + all ~24 call sites migrated onto `variant`/`size`/`shape`; bespoke sites grandfathered; Badge/Chip ESLint guard live. Follow-up: retire the MUI `Chip` shim; regen stale Storybook snapshots.                                               | — (done)                                                                                                                |
| ~~**C4 Input/InputGroup**~~ (DONE)  | Complete. Outliers migrated to `variant="surface"` or grandfathered (no one-off variants); Input ESLint guard live. Follow-up: retire `SearchField` onto `<SearchInput>`.                                                                                          | — (done)                                                                                                                |
| **C5 Select** (11/52)               | `SelectTrigger` `variant="surface"` (bg-card + rounded-lg — absorbs ~7 filter selects), `size="lg"` (h-10), `variant="ghost"/"embedded"` (reset border/shadow/bg). `SelectContent` is already clean                                                                | `SpaceActivityLog/ActivityLogFilters`, `MemberInviteRow`, `CurrencySelect`, `NetworkSelector`, `SafeSelectorDropdown`   |
| Checkbox/Switch/Radio/Toggle (1/52) | **essentially done** — 1 redundant class; skip or trivial                                                                                                                                                                                                          | `common/ToggleButtonGroup`                                                                                              |

Pattern to copy: the **Button** sweep + `UI/Button → Guidelines` story, and the **Tabs** `segmented` addition
(a 1:1 value port of a bespoke component onto a new variant). Fan-out shape: one agent per call-site file, each
migrating or skipping+justifying, self-verifying with `eslint`.

### D. Grandfathered button disables — AUDITED & CLOSED (2026-07-10)

**Resolved:** the **on-colour CTA** trio (`AddFundsBanner`, `EarnButton`, `AccountHeader`) was migrated onto
`variant="surface"` and its three disables deleted — see **B** (DONE).

**Kept as sanctioned escape hatches (decision):** the remaining button disables are each genuinely one-off,
structural, or stateful, and building a Button variant/size for each would (a) be a one-to-two-use addition and
(b) mix geometry with justify/font-weight/state concerns — contradicting the "no one-use variant" principle
applied across C1–C5 (e.g. we declined one-use `ghost`/`muted` on Input). The `eslint-disable` escape hatch
exists precisely for these. Audited and confirmed valid:

- **menu-item** (`h-auto` + row padding, `common/HelpMenu` ×2) — a single component; the real fix is
  `DropdownMenuItem`, not a Button size. Left grandfathered.
- **link/inline-text** (`WorkspaceBanner`, `SecurityChecks` toggle) — even a `size="inline"` (h-auto/p-0) wouldn't
  clear these: WorkspaceBanner keeps a flagged `text-xs`, and the security toggle isn't a `link` variant.
- **filled-icon action** (`SendTransactionButton`) & **pinned/active state** (`SafeAppActionButtons`) — stateful
  icon backgrounds/`svg` fills, not a fixed variant.
- **sidebar action** (`SidebarActionButton`) — collapsible `group-data-[collapsible=icon]` sizing, sidebar-only.
- **inline simulation toggle** (`QueuedTxSimulation`) — bespoke inline surface toggle.
- **split-button join** (`SplitMenuButton` ×2) — structural; would need a real `ButtonGroup` primitive (the button
  base already hints `in-data-[slot=button-group]:rounded-*`). Deferred as a **future primitive**, not a variant.
- `AppearanceSection` — no such disable exists (stale backlog note).

Net: 3 disables removed (via B); the rest are correct, documented exceptions. Re-open only if a pattern recurs
enough to earn a real variant, or when a `ButtonGroup` primitive is built for split buttons.

### E. Turn on the Argos visual gate (highest-leverage guard)

`.github/workflows/web-argos-storybook.yml` is fully wired (render-sweep → Argos, light+dark) but
`workflow_dispatch`-only. Change its trigger to `pull_request` (paths `apps/web/**`, `packages/**`). Only missing
piece: the **`ARGOS_TOKEN_STORYBOOK`** repo secret. Team CI-cost sign-off recommended.

### F. Migration PR un-draft items (the migration's, not this DS thread)

Full visual QA (light/dark/mobile) · SecurityHub visual eyeball (already shadcn) · `Receipt` gas-token display
(deliberate redesign — design call) · route screenshots for the PR "Visual summary".

---

## 4. Guardrails & gotchas

- **Closed presets take no styling `className`** (compile error) — add a semantic prop or a variant instead.
  Layout composites (`ActionBar`, `DialogActions`, `OnboardingFooter`) take `className` for **layout only**.
- **`cn()` precedence:** consumer `className` wins by default (last). To _lock_ a value, don't forward
  className, or put owned classes after it.
- **Tokens:** prefer shadcn semantic tokens (`bg-secondary`, `text-muted-foreground`, `bg-card`). Legacy brand
  vars (`--color-background-paper`, `--color-text-secondary`) exist and sometimes differ slightly in dark — a
  1:1 port may keep them (as `AccountsNavigation`/`segmented` did) to guarantee zero visual change.
- **`--input` is `#fff` in light** → visible borders use `border-border`, never `border-input`.
- **Filled `secondary` is invisible on muted page bg** → use `outline` there.
- **1Password/`op` flakiness:** `git push` (SSH) and `gh` (token via `op`) intermittently fail with auth
  errors — just retry (they recover). `gh` HTTPS token is read-only for pushes; `gh pr edit` works.
- **Don't commit `.claude/launch.json`** (local preview config).
- **Storybook**: `-p 6010` locally (6006 is often taken); editing files while it runs can leave a stale-chunk
  tab — restart the server to clear.

## 5. File map

- Primitives: `apps/web/src/components/ui/{button,tabs,card,dialog,drawer,sheet,badge,chip,input,input-group,select,checkbox,switch,radio,toggle}.tsx`
- Closed presets: `apps/web/src/components/common/{SubmitButton,ActionBar,DialogActions,OnboardingFooter,IconAction}/`
- Stories: `apps/web/src/components/ui/stories/*.stories.tsx` (`UI/*`); preset stories in `components/common/*/`
- ESLint guards: `apps/web/eslint.config.mjs` — `dsButtonClassnameRule` (Button/SubmitButton/ActionButton/SelectTrigger),
  `dsCardClassnameRule` (Card + slots + presets), `dsInputClassnameRule` (Input/InputGroup\* + presets),
  `dsBadgeClassnameRule` (Badge/Chip), `dsTabsClassnameRule` (TabsList/TabsTrigger), `dsDialogClassnameRule`
  (Dialog/Sheet/Drawer content+header+footer). All six live; `npx eslint src` is 0 errors.
- Docs: this file · `DESIGN_SYSTEM_CONSISTENCY.md` (method) · `.storybook/AGENTS.md` (authoring rules) · `DESIGN_SYSTEM_PROPOSALS.md` (decision log)
- Branch/PR: `feat/shadcn-migration` / #8040

## 6. Post-migration completeness audit (2026-07-13)

An adversarial per-family audit (variants present · test+story coverage · drift the literal ESLint guard can't
see) ran after all families landed. Results:

**Confirmed done:** every new cva variant/size/shape/radius is really defined and shown in a story; all six ESLint
guards are live with `eslint src` at 0 errors; the test suite is green.

**Closed by the audit:**

- **Variant test coverage** — was the biggest real gap (most new variants had zero assertions). Now **DONE**:
  +81 unit/render tests across Button/Select/Tabs (+ the 5 presets), Card (`sm`/`radius=xl`), Input
  (`inputSize` sm/default + `variant` default), Badge/Chip (`info`/`success`/`destructive`/`lg`), Dialog/Sheet
  (size/padding/surface/divided/floating). Two real test **bugs** fixed: `FiatChange.test` had vacuous MUI
  `toHaveStyle({'success.main'})` leftovers (replaced with real class assertions); the stale `TxStatusChip`
  MuiChip storybook snapshot was deleted and a proper unit test added.
- **Tabs ESLint guard** — Tabs got the `segmented` variant but no guard; `dsTabsClassnameRule` now added
  (one bespoke `gap-2` in `SecurityDrawerContent` grandfathered).

**Remaining follow-ups (out of the literal-guard scope — need Argos before de-drifting):** these call sites are
still on props-or-grandfather for _literal_ className, but hand-roll height/padding/radius/bg/border through
channels the regex guard structurally can't see (`className={css.module}`, `sx`, inline `style`, custom
`inputClassName`/`triggerClassName` props). Not regressions — a separate, disclosed cleanup:

- **Button (~20 sites)** — `AssetActionButton` icon buttons (`SendButton`, incl. an `h-8` hidden in a template
  literal), `StakeButton`/`EarnButton` **compact** branches (item B only migrated the non-compact CTA),
  `CounterfactualStatusButton`, `SafeAppsSDKLink`, `HnDashboardBanner`, `SpaceSidebarSelector`, `TokenMenu`,
  WalletConnect buttons, `BatchSidebar`, `RecoveryProposalCard`. (Button was declared "sweep done" for _literal_
  overrides; the css-module skins are this follow-up.)
- **Input** — `AddressBookSearchInput` `inputClassName="dark:bg-white/10 …"` (via a custom prop); the
  `largeFormFieldSurfaceClassName` constant still lives on a `NetworkSelector` trigger (spec said to delete once
  `xl`/`surface` landed).
- **Card (~10 sites)** — `ColorCodedTxAccordion`, `OverviewWidget`, `DataWidget`, `SafeAppSocialLinksCard`,
  `SecurityEmptyState`, `RecoveryCards`, `TxCard` css.cardContent, plus `SafeAppCard` inline `style={{height}}`.
- **Select** — `SafeAppsFilters`/`NetworkSelector`/`SignerSelector` css-module triggers (already the C5 follow-up).
- **Badge/Chip** — MUI `Chip` compat shim + `ColorCodedTxAccordion` runtime color-mix (intentional grandfathers).
- **Dialog** — `ModalDialog` keeps its css-module `min-width:600px`/`border-radius:24px` + inline width (linchpin).

**Known non-blocking limitations:** Sheet `size` (sm/md/lg/auto) is a no-op for left/right sheets (base
`data-[side]` widths win on specificity); real sheets keep grandfathered `w-[…]!` widths. Sheet stories omit
`size`/`padding`/`surface="paper"`; Dialog stories omit `divided="subtle"`.

**Genuinely blocked (not code):** **E** Argos visual gate (needs `ARGOS_TOKEN_STORYBOOK` secret) — the only way
to pixel-confirm the intentional shifts (Card radius flip, AccountHeader/on-colour CTAs, Badge/Chip shade+size,
Warning text size). **F** manual visual QA + the `Receipt` gas-token redesign (design call).
