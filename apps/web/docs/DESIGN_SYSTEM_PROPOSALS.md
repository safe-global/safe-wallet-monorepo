# Design-system proposals — decisions & applied changes

Outcome log of the Storybook UI audit on `feat/shadcn-migration` (light + dark, all `UI/*` atoms +
44 page stories + full 875-story render sweep). The original version of this file listed open
questions; everything below has since been **decided and applied** unless marked otherwise.
Skim it as the design-decision record for the PR review.

_Last updated: 2026-07-08._

## Tokens (decided: align with the brand palettes in `packages/theme`)

1. **Dark `--destructive` #9e4042 → #ff5f72** (brand dark `error.main`). The old value was ≈2.5:1 as
   text on dark surfaces; hit Alert/Badge/Button destructive variants. Solid destructive fills keep
   `--destructive-foreground: #fff`.
2. **Dark `--accent-success` #16a34a → #00b460** (brand dark `success.main`); the success Badge's dark
   text now uses it (`dark:text-accent-success`) instead of the washed-out mint `accent-secondary`.

## Components (decided)

3. **Chip `primary`** — now a solid `bg-primary text-primary-foreground` fill in both modes (the
   tinted version was pixel-identical to `default` in light). No app consumers existed yet.
4. **Calendar ranges** — mapped rdp v9 `range_start/middle/end`: accent band with rounded caps.
5. **Tabs dark active border** — the last `border-input` in the primitives → `border-border`.
6. **Combobox popup search field** — `border-input/30` (invisible in light) → `border-border/60`.
7. **CurrencySelect** — dropped the `rounded-xl` popup override; uses the shared `SelectContent` shape.
8. **Avatar** — `sm` group fallback text stepped to `text-xs` (no more clipped initials).
   8b. **Links** — default variant now has a rest-state underline (`decoration-primary/40`, full on
   hover). Light-mode links were pixel-identical to body text; this also fixes the settings/DeFi
   inline links flagged across page stories.
   8c. **Floating sidebar** — restored `ring-1 ring-sidebar-border` (was invisible on white backgrounds
   after the Figma-motivated shadow removal).
   8d. **Switch** — unchecked track `bg-input` (white in light) → `bg-muted`.
   8e. **Welcome login panel** — kept **intentionally theme-static white** (per the documented
   `walletBtnStatic` intent); the stray themed "Watch any account" button is pinned to static
   colors so the panel is coherent in dark mode.
9. **SecurityReportDrawer** — hard-coded `bg-zinc-50` + `dark:bg-card` → single `bg-card`.

## Storybook infra & story-mock gaps (decided/fixed)

10. **Queue story** — the mock data was internally inconsistent, not the wallet: the executable tx
    now sits at `safeData.nonce` (was hard-coded 44 vs safe nonce 28) and `missingSigners` includes
    the connected owner. Confirm/Execute render enabled. Bulk execute stays disabled (needs a
    relayable batch — accurate).
11. **Dark canvas** — now `#000`, matching the dark `--background` token (no more `bg-background`
    patches in dark stories).
12. **Context menu** — `Open` story added using a right-click `play` function; all overlay atoms
    (dialog, alert-dialog, drawer, dropdown, hover-card, popover, sheet, tooltip, sonner) now have
    open-state stories.
    12b. **Story-mock gaps** — AddressBook seeds entries; Spaces Members handler returns the correct
    `MembersDto` shape (`{ members: [...] }` — was a bare array) with two members; UserSettings
    authenticates the mock session; onboarding Accounts/Workspaces stories set their real
    `pathname` so the switcher's active state renders (it was a story-router gap, **not** an app
    bug); the create-flow networks multiselect got a real robustness fix in the component (chain
    configs arriving after mount now seed the form) plus an empty-state placeholder.
    **Imprint/Licenses**: not a bug — content is host-gated and renders on `localhost:6006`; audit
    tooling must serve static builds on a whitelisted port (e.g. 4000), see `OFFICIAL_HOSTS`.

## Storybook ↔ implementation consistency (audited)

- **All 43 page stories mount the real Next.js page modules** (verified import-level; the spaces
  Settings story deliberately mounts `settings/general` because the index page only redirects).
- **Button/Input variant coverage is complete**: every variant/size the app uses appears in the
  `UI/Button` / `UI/Input` stories. (Story-only extras: Button `xs`/`icon-lg`, Input `inputSize` —
  kept as documentation.)
- **Real-app spot check**: the running app (read-only Safe, no wallet) renders identical tokens and
  states to the stories — e.g. dark disabled primary buttons compute to the same muted values in
  both.
- **Deleted 6 hand-built mockup story files** whose surfaces are covered by real-component/page
  stories (myAccounts, tx-flow, new-safe, address-book, welcome, safe-messages) per the
  `.storybook/AGENTS.md` rule. `SpaceNestedSafesButton`'s intentional mockup was re-synced with the
  real markup.

## Remaining roadmap (not applied — needs owners)

- **11 mockup story files remain** (walletconnect, recovery, counterfactual, nfts, proposers,
  notification-center, speedup, bridge, tx-notes, targeted-outreach, no-fee-campaign). They are
  allowed by convention while no real-component stories exist, **but their copy is invented** (not
  even stale — never existed in source), so treat them as layout sketches, not design references.
  Replace with real-component stories feature by feature.
- **MSW handler coverage** for the remaining non-hermetic Components/Features stories (the Pages
  group was made hermetic in this pass — see `stories/mocks/handlers.ts`).
- **Chromatic in CI** — still the highest-leverage guard (see DESIGN_SYSTEM_CONSISTENCY.md #5).
