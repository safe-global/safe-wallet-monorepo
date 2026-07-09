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

---

## 3. Remaining work (each item is independent — parallelize freely)

| #      | Item                                                                                        | Effort | Blocked by         | Kind        |
| ------ | ------------------------------------------------------------------------------------------- | ------ | ------------------ | ----------- |
| ~~A~~  | ~~Finish `DialogActions` + skipped footers~~ — **DONE** (item A)                            | —      | —                  | code        |
| B      | On-colour CTA decision (Earn/AddFunds/AccountHeader)                                        | S      | **design nod**     | design→code |
| C1     | **Card** family (biggest drift) — [spec](./design-system/card-family-spec.md)               | M      | —                  | code        |
| C2     | **Dialog/Drawer/Sheet** family — [spec](./design-system/dialog-drawer-sheet-family-spec.md) | M      | —                  | code        |
| C3     | **Badge/Chip** family — [spec](./design-system/badge-chip-family-spec.md)                   | M      | —                  | code        |
| C4     | **Input/InputGroup** family — [spec](./design-system/input-inputgroup-family-spec.md)       | M      | —                  | code        |
| ~~C5~~ | ~~**Select** family~~ — **DONE** (literal-className sites; css-module sites follow-up)      | —      | —                  | code        |
| D      | Sweep up the 11 grandfathered button disables (via new presets)                             | M      | some need B/design | code        |
| E      | Turn on the Argos visual gate on PRs                                                        | S      | **repo secret**    | infra       |
| F      | Migration PR's own un-draft items (not the DS thread)                                       | —      | —                  | QA          |

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

| Family                              | Drift                                                                                                                                                                                                                                                              | Add these variants/sizes                                                                                                                                                                                | Start-here files                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **C1 Card** (41/51)                 | most drift; almost no variants                                                                                                                                                                                                                                     | `variant="plain"/"flush"` (no padding/gap/border — the biggest cluster), `variant="outlined"` (re-add `border-border`), a surface-colour option (`bg-muted`/paper), reconsider the `rounded-xl` default | `tx-flow/common/TxCard`, `TxDetails/TxData/NestedTransaction`, `earn/.../EarnInfo`, `spaces/.../WorkspaceBanner`, `safe-apps/SafeAppCard` |
| **C2 Dialog/Drawer/Sheet** (33/50)  | Content `padding` prop (`none` clears ~16 sites), Header/Footer `divided` (border), Content `size` width scale (map the `MAX_WIDTH_MAP` in `ModalDialog`), Sheet `variant="floating"`, Content `surface` (card/paper). Footer rows → route through `DialogActions` | `SecurityReportDrawer`, `TrustedSafesModal`, `proposers/UpsertProposer`, `hypernative/HnModal`, `batching/BatchSidebar`                                                                                 |
| **C3 Badge/Chip** (26/43)           | shared `size` (sm/default/lg + auto-height); bring `Chip` to Badge variant parity (`warning`/`success`/`destructive`/`info`); `positive`/`negative` value chips; squared `tag` shape                                                                               | `proposers/PendingDelegationsList`, `TxStatusChip`, `AssetsTable/FiatChange`, `transactions/Warning`, `SpaceSettings/pages/AboutPage`                                                                   |
| **C4 Input/InputGroup** (13/75)     | **InputGroup has no `size` prop** — add `inputSize` sm/default/lg (mirror `Input`); `xl` (66px) tier on both; a `surface` (bg-card) skin; a **search preset** (icon addon + height) to retire the `SearchField`-vs-`InputGroup` split                              | `MyAccountsV2/.../AccountsSearch`, `common/formFieldStyles.ts`, `common/SearchField`, `CreateSpaceOnboarding`, `common/DatePickerInput`                                                                 |
| **C5 Select** (11/52)               | `SelectTrigger` `variant="surface"` (bg-card + rounded-lg — absorbs ~7 filter selects), `size="lg"` (h-10), `variant="ghost"/"embedded"` (reset border/shadow/bg). `SelectContent` is already clean                                                                | `SpaceActivityLog/ActivityLogFilters`, `MemberInviteRow`, `CurrencySelect`, `NetworkSelector`, `SafeSelectorDropdown`                                                                                   |
| Checkbox/Switch/Radio/Toggle (1/52) | **essentially done** — 1 redundant class; skip or trivial                                                                                                                                                                                                          | `common/ToggleButtonGroup`                                                                                                                                                                              |

Pattern to copy: the **Button** sweep + `UI/Button → Guidelines` story, and the **Tabs** `segmented` addition
(a 1:1 value port of a bespoke component onto a new variant). Fan-out shape: one agent per call-site file, each
migrating or skipping+justifying, self-verifying with `eslint`.

### D. Grandfathered button disables (11 files) → future presets

Each remaining `// eslint-disable-next-line no-restricted-syntax` maps to a preset/variant to build; adding it
deletes the disable:

- **on-colour CTA** → see **B** (`AddFundsBanner`, `EarnButton`, `AccountHeader`).
- **menu-item size** (`h-auto` + row padding) → `common/HelpMenu`.
- **link-variant reset** (link buttons shed height/padding) → `spaces/.../WorkspaceBanner`, `SecurityChecks` inline toggle.
- **card/toggle pattern** (selectable cards as buttons) → `SpaceSettings/sections/AppearanceSection`.
- **filled-icon action** → `spaces/.../SafeAccounts/SendTransactionButton`.
- **sidebar action** (tight radius + collapsible) → `spaces/.../Sidebar/NewTransactionButton/SidebarActionButton`.
- **split-button join** (structural — likely stays disabled or needs a real `ButtonGroup` primitive) → `common/SplitMenuButton`.
- **pinned/active state** + **inline simulation toggle** → `SafeAppActionButtons`, `transactions/QueuedTxSimulation`.

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
- ESLint guard: `apps/web/eslint.config.mjs` (`dsButtonClassnameRule`)
- Docs: this file · `DESIGN_SYSTEM_CONSISTENCY.md` (method) · `.storybook/AGENTS.md` (authoring rules) · `DESIGN_SYSTEM_PROPOSALS.md` (decision log)
- Branch/PR: `feat/shadcn-migration` / #8040
