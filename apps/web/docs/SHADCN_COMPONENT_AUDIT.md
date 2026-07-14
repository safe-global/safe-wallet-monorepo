# shadcn Component Audit

Audit date: 2026-07-03

Scope: PR-focused audit of changed `apps/web` production files, changed stories/Storybook setup, and shared `components/ui` primitives, plus full-app guardrails for leftover MUI and token drift.

## Handover snapshot

Last updated: 2026-07-03, after the Global push-notification list-surface wave.

This document is the durable handover for the shadcn migration audit work. The branch still has broad uncommitted Storybook and product-surface changes from other agents; do not rewrite, revert, stage, or commit those wholesale unless the next agent is explicitly taking ownership of that work.

### Completed waves

- P0 MUI cleanup: the Address Book input and Space Address Book cluster were migrated away from MUI imports.
- P1 primitives:
  - `components/ui/button.tsx` outline styling now uses shadcn/theme tokens.
  - `components/ui/button.tsx` supports `render={<a />}` while preserving link semantics.
  - `components/ui/alert.tsx` warning styling now uses semantic warning token aliases from `styles/shadcn.css`.
  - `components/ui/typography.tsx` no longer applies negative heading letter spacing.
  - `components/ui/card.tsx` supports a polymorphic `as` prop for semantic card wrappers.
- Space settings consolidation:
  - Added `SpaceSettingsSection`, backed by shadcn `Card as="section"`.
  - Migrated Account, About, Identity, Appearance, and Danger Zone sections.
  - Replaced visible raw controls in Space settings with shadcn `Button`.
- Settings page consolidation:
  - Added shared `components/settings/SettingsCard`, backed by shadcn `Card`.
  - Migrated `SafeModules`, `TransactionGuards`, `SafeAppsSigningMethod`, `FallbackHandler`, `EnvironmentVariables`, `SecuritySettings`, `DataManagement`, `NestedSafesList`, `SafeAppsPermissions`, and `ProposersList`.
- Feature banner/card cleanup:
  - Migrated the Recovery proposal and in-progress vertical cards to shadcn `Card`; horizontal variants already route through shared `ActionCard`.
  - Migrated `HnActivatedSettingsBanner` from a raw paper-background shell to shadcn `Card` while preserving the existing banner layout and CTA.
- Feature list cleanup:
  - Migrated the nested `GlobalPushNotifications` Safe-selection surface from raw paper/background classes to shadcn `List`/`ListItem` with tokenized `border-border bg-card`.
  - Kept the row hit targets as `role="button"` in this wave because the Safe address row includes `EthHashInfo`, which can embed copy-address behavior.
- Audit documentation:
  - Added this audit report and kept the completed/deferred sections current after each wave.

### Verification snapshot

Focused checks passed after the latest wave:

```bash
yarn workspace @safe-global/web test \
  src/components/settings/SettingsCard/index.test.tsx \
  src/components/settings/EnvironmentVariables/__tests__/index.test.tsx \
  src/components/settings/SafeModules/__tests__/SafeModules.test.tsx \
  src/components/settings/TransactionGuards/__tests__/TransactionGuards.test.tsx \
  src/components/settings/SafeAppsSigningMethod/index.test.tsx \
  src/components/settings/FallbackHandler/__tests__/index.test.tsx \
  src/components/settings/SecuritySettings/index.test.tsx \
  src/components/settings/DataManagement/index.test.tsx \
  src/components/settings/NestedSafesList/index.test.tsx \
  src/components/settings/SafeAppsPermissions/index.test.tsx \
  src/components/settings/ProposersList/index.test.tsx \
  src/components/settings/FeeTokenPreference/index.test.tsx \
  src/components/settings/PushNotifications/index.test.tsx \
  --runInBand
```

Result: 13 suites passed, 38 tests passed.

Additional focused checks passed:

```bash
node node_modules/prettier/bin/prettier.cjs --check --config ./.prettierrc --ignore-path ./.prettierignore <touched audit files>
yarn workspace @safe-global/web eslint <touched audit ts/tsx files>
yarn workspace @safe-global/web type-check
rg -n "@mui|@emotion" apps/web/src --glob "*.ts" --glob "*.tsx"
git diff --check -- <tracked touched audit files>
```

Recovery card checks passed:

```bash
yarn workspace @safe-global/web test \
  src/features/recovery/components/RecoveryCards/__tests__/RecoveryInProgressCard.test.tsx \
  src/features/recovery/components/RecoveryCards/__tests__/RecoveryProposalCard.test.tsx \
  --runInBand
```

Result: 2 suites passed, 10 tests passed.

Hypernative banner checks passed:

```bash
yarn workspace @safe-global/web test \
  src/features/hypernative/components/HnActivatedSettingsBanner/HnActivatedSettingsBanner.test.tsx \
  --runInBand
```

Result: 1 suite passed, 1 test passed.

Global push-notification list checks passed:

```bash
yarn workspace @safe-global/web test \
  src/components/settings/PushNotifications/__tests__/GlobalPushNotifications.test.ts \
  --runInBand

yarn workspace @safe-global/web test \
  src/components/settings/PushNotifications/index.test.tsx \
  --runInBand
```

Result: `GlobalPushNotifications` 1 suite passed, 39 tests passed; `PushNotifications` 1 suite passed, 1 test passed.

Current targeted page-level shell scan:

```bash
rg -n "rounded-lg bg-\[var\(--color-background-paper\)\]|bg-\[var\(--color-background-paper\)\].*p-8|rounded-xl bg-\[var\(--color-background-paper\)\]" \
  apps/web/src/components/settings apps/web/src/features -g "*.tsx"
```

Result: no matches. The broader `bg-[var(--color-background-paper)]` scan in the settings/Hypernative/recovery neighborhood now only finds `HnSignupFlow/HnModal` as a dialog content override, not a settings-card/list shell.

Current branch-level status:

```bash
yarn verify:changed:web
```

Fresh run after the Global push-notification list-surface wave still exits 1. The script detected 1,167 changed files and ran the full web verify path; Codex truncated the very large Jest output, so treat the exact failing-suite count below as needing a fresh terminal/log capture before merge.

Confirmed blockers visible in the fresh run:

- `features/gtf/components/FeeInfoBanner/FeeInfoBanner.test.tsx` expects stale copy (`Pay fees directly from your Safe wallet.`) while the component renders `Soon, fees will be paid from your Safe balance.`
- `features/spaces/components/SpacesList/__tests__/SpacesList.test.tsx` still fails in auth/expiry state rendering around the Accounts navigation expectations.
- Base UI native-button warnings still appear in unrelated Spaces/transaction surfaces, including `SpacesList` and `SingleTx`/accordion paths.
- The coverage guard reports 608 changed files without corresponding tests.
- Earlier branch-level run before the final two waves reported 16 failing Jest suites, 36 failing tests, and 4 failing snapshots. Re-run with output redirected to a log if exact final counts are needed.

The migrated settings-card, Hypernative banner, and Global push-notification list tests pass in focused runs.

### Remaining shadcn audit work

- Dashboard/card surfaces outside settings remain intentionally deferred. Review them by journey instead of introducing a broad global `Panel`.
- Storybook visual validation is still pending for the migrated settings/card primitives. Preserve existing Storybook taxonomy/provider changes from the other agent.
- Branch-level verify blockers need triage before commit/merge; start with the stale GTF fee banner copy test and Spaces list auth-state failures visible in the fresh `verify:changed:web` run.

### Suggested next-agent sequence

1. Re-run the quick guardrails: MUI scan, raw settings-shell scan, and focused settings tests listed above.
2. Fix branch-level blockers before broad visual validation: start with the stale GTF fee banner copy test, then triage Spaces list auth-state failures and remaining snapshot/test failures by feature area.
3. If continuing shadcn cleanup before branch-level green, do one isolated wave at a time:
   - Wave A: dashboard/product-card surfaces by journey, only after the branch-level blockers are triaged
   - Wave B: row-control/accessibility review for nested selectable lists, including `GlobalPushNotifications`, if product wants to replace `role="button"` wrappers
4. For each wave, add/adjust focused unit/component tests first, then run focused tests, scoped ESLint, scoped Prettier, `type-check`, and finally `yarn verify:changed:web`.
5. Use Storybook/Chromatic or targeted Playwright screenshots only after source tests are stable; do not use E2E as a substitute for missing component tests.

### Scoped commit candidate

If committing this audit work separately, stage only the migration/audit files owned by these waves. Do not include broad Storybook taxonomy work, `.claude/`, unrelated settings files such as `ContractVersion`, or deleted/renamed Storybook files unless explicitly taking over that scope.

Owned file set for a scoped migration-audit commit:

```text
apps/web/docs/SHADCN_COMPONENT_AUDIT.md
apps/web/src/components/common/AddressBookInput/RecipientGroupHeader.tsx
apps/web/src/components/common/AddressBookInput/RecipientGroupHeader.test.tsx
apps/web/src/components/common/AddressBookInput/RecipientOption.tsx
apps/web/src/components/common/AddressBookInput/RecipientOption.test.tsx
apps/web/src/components/common/AddressBookInput/styles.module.css
apps/web/src/components/settings/DataManagement/index.tsx
apps/web/src/components/settings/DataManagement/index.test.tsx
apps/web/src/components/settings/EnvironmentVariables/__tests__/index.test.tsx
apps/web/src/components/settings/EnvironmentVariables/index.tsx
apps/web/src/components/settings/FallbackHandler/__tests__/index.test.tsx
apps/web/src/components/settings/FallbackHandler/index.tsx
apps/web/src/components/settings/FeeTokenPreference/index.test.tsx
apps/web/src/components/settings/FeeTokenPreference/index.tsx
apps/web/src/components/settings/NestedSafesList/index.tsx
apps/web/src/components/settings/NestedSafesList/index.test.tsx
apps/web/src/components/settings/ProposersList/index.test.tsx
apps/web/src/components/settings/ProposersList/index.tsx
apps/web/src/components/settings/PushNotifications/index.test.tsx
apps/web/src/components/settings/PushNotifications/index.tsx
apps/web/src/components/settings/PushNotifications/GlobalPushNotifications.tsx
apps/web/src/components/settings/PushNotifications/__tests__/GlobalPushNotifications.test.ts
apps/web/src/components/settings/SafeAppsPermissions/index.test.tsx
apps/web/src/components/settings/SafeAppsPermissions/index.tsx
apps/web/src/components/settings/SafeAppsSigningMethod/index.test.tsx
apps/web/src/components/settings/SafeAppsSigningMethod/index.tsx
apps/web/src/components/settings/SafeModules/__tests__/SafeModules.test.tsx
apps/web/src/components/settings/SafeModules/index.tsx
apps/web/src/components/settings/SecuritySettings/index.test.tsx
apps/web/src/components/settings/SecuritySettings/index.tsx
apps/web/src/components/settings/SettingsCard/index.test.tsx
apps/web/src/components/settings/SettingsCard/index.tsx
apps/web/src/components/settings/TransactionGuards/__tests__/TransactionGuards.test.tsx
apps/web/src/components/settings/TransactionGuards/index.tsx
apps/web/src/components/ui/alert.test.tsx
apps/web/src/components/ui/alert.tsx
apps/web/src/components/ui/button.test.tsx
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/card.test.tsx
apps/web/src/components/ui/card.tsx
apps/web/src/components/ui/typography.test.tsx
apps/web/src/components/ui/typography.tsx
apps/web/src/features/spaces/components/SpaceAddressBook/LocalContactActions.test.tsx
apps/web/src/features/spaces/components/SpaceAddressBook/LocalContactActions.tsx
apps/web/src/features/spaces/components/SpaceAddressBook/RequestToAddButton.tsx
apps/web/src/features/spaces/components/SpaceAddressBook/__tests__/RequestToAddButton.test.tsx
apps/web/src/features/recovery/components/RecoveryCards/RecoveryInProgressCard.tsx
apps/web/src/features/recovery/components/RecoveryCards/RecoveryProposalCard.tsx
apps/web/src/features/recovery/components/RecoveryCards/__tests__/RecoveryInProgressCard.test.tsx
apps/web/src/features/recovery/components/RecoveryCards/__tests__/RecoveryProposalCard.test.tsx
apps/web/src/features/hypernative/components/HnActivatedSettingsBanner/HnActivatedSettingsBanner.test.tsx
apps/web/src/features/hypernative/components/HnActivatedSettingsBanner/HnActivatedSettingsBanner.tsx
apps/web/src/features/spaces/components/SpaceSettings/SpaceSettingsSection.tsx
apps/web/src/features/spaces/components/SpaceSettings/__tests__/AboutPage.test.tsx
apps/web/src/features/spaces/components/SpaceSettings/__tests__/AppearanceSection.test.tsx
apps/web/src/features/spaces/components/SpaceSettings/__tests__/SpaceSettingsSection.test.tsx
apps/web/src/features/spaces/components/SpaceSettings/pages/AboutPage.tsx
apps/web/src/features/spaces/components/SpaceSettings/pages/AccountPage.tsx
apps/web/src/features/spaces/components/SpaceSettings/sections/AppearanceSection.tsx
apps/web/src/features/spaces/components/SpaceSettings/sections/DangerZoneSection.tsx
apps/web/src/features/spaces/components/SpaceSettings/sections/IdentitySection.tsx
apps/web/src/styles/shadcn.css
```

## Baseline

- Branch: `feat/shadcn-migration`
- Base diff against `origin/dev`: 1,021 files, 28,092 insertions, 26,312 deletions.
- Dirty worktree at original audit baseline: 82 files, mostly Storybook taxonomy/provider updates from another agent. The handover snapshot above is the newer source of truth for completed and remaining audit work.
- Changed production TS/TSX files scanned: 686.
- Changed Storybook/story files scanned: 195.
- Shared UI primitive files scanned: 56.
- Changed production files importing `@/components/ui/*`: 571.
- Current Storybook coverage report: 1,109 components, 1,037 covered (94%); only the `Mocks` group is uncovered.

## P0 findings

These blocked a "MUI removed from production source" claim in the baseline audit. They were fixed in the first
follow-up wave after this report.

- `components/common/AddressBookInput/RecipientGroupHeader.tsx` imported MUI `Box`, `Tooltip`, and `Typography`.
- `components/common/AddressBookInput/RecipientOption.tsx` imported MUI `Box`, `Tooltip`, `Typography`, `useMediaQuery`, and `useTheme`.
- `features/spaces/components/SpaceAddressBook/LocalContactActions.tsx` imported MUI `Button`, `DialogActions`, `DialogContent`, `SvgIcon`, `Tooltip`, and `IconButton`.
- `features/spaces/components/SpaceAddressBook/RequestToAddButton.tsx` imported MUI `Alert`, layout primitives, buttons, spinner, tooltip, and typography.

Recommended fix: migrate this address-book cluster to shadcn `Button`, `Tooltip`, `Alert`, `DialogFooter`, `Spinner`, and `Typography`; replace MUI layout primitives with Tailwind `div`s; replace MUI breakpoint usage with `useMediaQuery('(max-width:1199.95px)')`.

Current status: `rg -n "@mui|@emotion" apps/web/src --glob "*.ts" --glob "*.tsx"` returns no production source matches.

## P1 findings

These affect shared consistency but need focused review before broad fan-out.

- `components/ui/button.tsx` used hard-coded `rgba(...)` values and `--unofficial-outline-hover` in the `outline` variant. Fixed in the P1 primitive wave by using tokenized `bg-background` / `hover:bg-muted` classes.
- `components/ui/alert.tsx` had `warning` hard-coded to yellow Tailwind colors while `success` used Safe semantic CSS vars. Fixed in the P1 primitive wave by adding `warning-subtle`, `warning-muted`, and `warning-strong` token aliases in `shadcn.css`.
- `components/ui/typography.tsx` centralized hard-coded Figma sizes and negative letter spacing. The P1 primitive wave removed negative tracking from heading variants; raw size classes remain intentionally centralized inside the primitive.
- `components/ui/card.tsx` has the correct shadcn composition API, but app consumers do not consistently use `CardHeader`/`CardContent`/`CardFooter`, often overriding padding directly on `Card`.

## P2 findings

These should be consolidated after P0/P1 are stable.

- Raw framed surfaces are common in dashboard/settings pages: repeated `rounded-lg bg-[var(--color-background-paper)] p-8` and `rounded-xl bg-card p-*` patterns should become `Card` or an app-level `Panel`/`SettingsSection` wrapper.
  - Completed first consolidation wave for Space settings: repeated `bg-card rounded-2xl p-6 mb-3` sections now use a local `SpaceSettingsSection` backed by shadcn `Card as="section"`.
  - Completed settings-page consolidation waves: `SafeModules`, `TransactionGuards`, `SafeAppsSigningMethod`, `FallbackHandler`, `EnvironmentVariables`, `SecuritySettings`, `DataManagement`, `NestedSafesList`, `SafeAppsPermissions`, `ProposersList`, `FeeTokenPreference`, and `PushNotifications` now use a local `SettingsCard` backed by shadcn `Card`.
  - Remaining recommendation: review dashboard/settings panels separately before introducing a global `Panel`; their layout contracts differ from the Space settings sections.
- `components/common/TableCard` intentionally centralizes the `bg-card rounded-lg p-4` table-shell pattern and should be kept unless replaced by a more general wrapper.
- Raw controls remain in 27 review lines. Many are allowed Base UI `render` targets or nested-interaction workarounds, but visible standalone controls should be audited before adding more.
  - Completed first raw-control wave for Space settings: support/cookie/theme controls now use shadcn `Button`; `SpaceSettings` production files now have no raw `<button>`, `<input>`, `<select>`, or `<textarea>` matches.
  - Shared `Button render={<a />}` now preserves real link semantics instead of emitting the Base UI native-button warning.
- Address-book autocomplete CSS contained stale comments about MUI Autocomplete. The comments in the P0 address-book
  files were removed in the first fix wave; continue auditing other stale migration comments as adjacent cleanup.

## P3 completed in this pass

- Space settings headings now use `SpaceSettingsSectionTitle`, which routes through `Typography` and removes repeated consumer-level `tracking-tight` overrides.
- The Space settings theme selector no longer uses arbitrary `border-[1.5px]`; it uses token-friendly Tailwind border utilities.
- Recovery proposal and in-progress vertical cards now use shadcn `Card`; horizontal variants already route through the shared `ActionCard`.
- Hypernative's activated settings banner now uses shadcn `Card`; the existing branded badge/status/CTA styling remains feature-local pending product/design token review.
- Global push-notification Safe selection now uses shadcn `List`/`ListItem` for the nested list surface and tokenized `border-border bg-card` classes.

## P3/P4 deferred

- Transaction and tx-flow raw controls should be reviewed in money-movement batches, not mixed into a broad cleanup.
- Safe Shield, Hypernative, dashboard illustrations, and branded gradient areas contain hard-coded colors. Many are brand/prototype visuals; keep them deferred unless design tokens exist.
- Storybook taxonomy work should be preserved. Do not rewrite existing uncommitted story changes wholesale; use Storybook for targeted visual validation after source fixes.
- About page row links are still custom row anchors; keep them as links for now, or review whether a dedicated `RowLink` wrapper should be added in a later feature-local pass.
- `GlobalPushNotifications` still has custom `role="button"` row targets around checkbox/address content; keep them until a focused nested-interaction/accessibility pass decides how to handle `EthHashInfo` copy controls.

## Validation commands

Use these checks after each fix wave:

```bash
rg -n "@mui|@emotion" apps/web/src --glob "*.ts" --glob "*.tsx"
yarn verify:changed:web
```

For visual validation:

```bash
yarn workspace @safe-global/web storybook
yarn workspace @safe-global/web test:storybook
```
