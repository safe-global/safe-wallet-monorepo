# Design-system consistency — status & next steps

Handoff for the "consistency via variants, not custom styling" effort on `feat/shadcn-migration`
(PR #8040). Read this + the `UI/Button` and `UI/Input` Storybook stories and
[.storybook/AGENTS.md → "Component variants over custom styling"](../.storybook/AGENTS.md) before continuing.

_Last updated: 2026-07-04._

## Method (repeat this for each component family)

1. **Recon** the shared primitive(s) in `components/ui/*` — what cva `variant`/`size` exists, what tokens.
2. **Delegate a read-only audit** (Workflow, ~9 files/agent) that classifies every call site as
   `consistent` / `safe-fix` (exact before→after) / `needs-decision`. Scripts live in the session
   scratchpad (`btn-analysis.mjs`, `input-analysis.mjs`) — copy the pattern.
3. **Add variants** to the primitive for recurring patterns (user approved adding variants), document in the story.
4. **Apply safe-fixes** (delegate a fixer Workflow OR do directly if few); **decide `needs-decision`
   items from evidence** — sibling buttons in the same parent, similar components elsewhere, and the
   parent surface's background. Don't guess; don't blanket-restyle.
5. **Verify** `yarn verify:changed:web` (type-check + lint + prettier + tests) + Storybook spot-check
   light & dark, then commit + push + update the PR.

## Done & pushed (through commit `ae9d17065`)

- **Button family** — added `size="action"` (h-10 px-6 toolbar/CTA pill), `size="submit"` (action +
  stable min-width for modal/flow submits; replaces magic `min-w-[…]`), `variant="destructive-outline"`.
  Applied across ActionsTray, Spaces HeaderActions, Filter/Export toolbar, queue Confirm/Execute/Reject,
  message Sign, Bulk execute, cookie banner, settings/dialog CTAs. All documented in the Button story.
- **Input family** — `Input`, `InputGroup`, `SelectTrigger` primitives now default to the visible
  **`border-border`** token (was `border-input`); `Input` gained **`inputSize` (sm/default/lg)** mirroring
  `SelectTrigger`. Search-field/select safe-fixes applied. Documented in the Input story.
- **Docs (DRY):** the single reference is `.storybook/AGENTS.md` → "Component variants over custom styling";
  `apps/web/AGENTS.md` has a one-line pointer (and its stale "use MUI" principle was replaced). `CLAUDE.md`
  just delegates to AGENTS.md — don't duplicate there.

## Button call-site sweep + machine enforcement (this pass)

The Button variants already existed, but call sites bypassed them with one-off `className` overrides (the
welcome/Accounts header was the trigger: three sibling buttons, all `size="sm"`, each overriding
height/font/radius). This pass fixed the drift AND added a machine guard so it can't come back silently.

- **Reference screen** — `AccountsHeader` (Add/Create/Connect now share `size="action"`; hierarchy via
  variant), `CreateButton`, `DataWidget`, and `ConnectWalletButton` (its `small` boolean + `text-xs` hack
  replaced with a real `size` prop, so its 3 divergent call-site renders now pass an explicit `size`).
- **App-wide sweep** — 44 flagged `<Button>` call sites across 30 files normalized: redundant/no-op utils
  stripped, height/skin remapped to `size`/`variant`. Genuinely structural or not-yet-expressible cases carry a
  justified `// eslint-disable-next-line no-restricted-syntax -- <reason>` (split-button corner joins; the
  documented `h-12` onboarding scale; on-colour/"paper" CTAs; menu-item / link-reset / card-toggle buttons).
  **Those disables ARE the design backlog** — each is a variant the DS should eventually absorb (see pipeline).
- **Docs** — the `UI/Button` story gained a **Guidelines** tab (variant/size decision matrix + a Do/Don't built
  from the real Accounts anti-pattern); `.storybook/AGENTS.md` now states the "className is layout-only" rule.

### The enforcement layer (repeatable for every primitive)

1. **ESLint** — `no-restricted-syntax` in `apps/web/eslint.config.mjs` errors when a `<Button>` `className`
   sets a property the `size`/`variant` props own (`h-*`, `px-*`/`py-*`, `text-xs|sm|base|lg`, `rounded-*`,
   `bg-*`). It runs on every PR through `web-checks.yml` (no workflow change needed) and doubles as the audit
   tool. Generalize to the next family by adding a sibling selector for its element name (`Input`, `Card`, …).
2. **Argos visual regression** — `.github/workflows/web-argos-storybook.yml` screenshots every story light+dark
   via `scripts/storybook/render-sweep.ts` and diffs in Argos. Currently `workflow_dispatch`-only; enabling it
   on PRs (needs the `ARGOS_TOKEN_STORYBOOK` secret + a nod on CI cost) is the highest-leverage guard for
   catching visual drift the lint rule can't see. (This is the org's visual-regression tool — not Chromatic.)
3. **Story + AGENTS.md** — each primitive's story documents "when to use which variant/size" (the Button
   Guidelines tab is the template); `.storybook/AGENTS.md` holds the authoring-time rule.

### Per-family pipeline (do this for the next primitive)

recon the cva → audit call sites (extend the ESLint selector; it enumerates the offenders) → add variants for
recurring patterns → document the decision matrix in the family's story → apply safe-fixes + grandfather the
rest with justified disables → let Argos + the ESLint rule guard it. The disables logged in this pass are the
first backlog items: an **on-colour/"paper" button variant**, a **menu-item size**, a **link-variant
height/padding reset**, a **taller onboarding CTA size**, and a **selectable card/toggle pattern**.

### Preset "factory" layer (a guarantee, not just a guardrail)

Docs + the ESLint rule stop the _wrong_ thing; purpose-built preset components make the _right_ thing the only
thing a product dev types (the "pit of success"). Rule: **one preset per recurring semantic intent, favouring
composites that also own layout** — not one per prop combo (that re-explodes what variants collapsed). The
primitive `<Button>` + variants remain the substrate (what presets are built from, plus genuine one-offs) and
the ESLint rule keeps guarding it. Shipped (in `components/common/`, with stories):

- **`SubmitButton`** — owns `size="submit"` + the loading → spinner swap (stable width). Migrated:
  `CounterfactualForm`, `NftSendForm`. Reach for it instead of `<Button size="submit">` + a hand-rolled spinner.
- **`ActionBar` + `ActionButton`** — the CTA row: `ActionBar` owns gap/wrap, `ActionButton` locks `size="action"`;
  variant carries emphasis. Migrated: dashboard `HeaderActions`.
- **`DialogActions`** — canonical Cancel(outline)+Confirm(default/destructive) footer; owns order, sizes,
  spinner, and responsive layout. Migrated: `SpaceCreationModal`, `DeleteSpaceDialog`. Resolves the Cancel
  `ghost`-vs-`outline` split. (Named `DialogActions`, not `DialogFooter` — that's the shadcn layout slot.)
- **`OnboardingFooter`** — Back/Continue footer for the full-screen onboarding flows; owns the new `size="xl"`
  (48px) scale, chevrons, spinner, and stacked-mobile → row-on-xl layout. Migrated: all 4 flows
  (`CreateSpace`, `InviteMembers`, `SelectSafes`, `Survey`) — **deleted the 8 `h-12` `eslint-disable`s**. The
  `h-12` scale became a real `xl` Button size (documented in the Button story), so no disable is needed.
- **`IconAction`** — the compact top-bar icon button (locks `variant="ghost"` + `size="icon-sm"` + margin).
  Migrated: `HeaderNavigation` (search/notifications/batch), `WcIcon`.
- **`surface` variant** (on `button.tsx`) — card-surface CTA for coloured/promo surfaces. Migrated `StakeButton`
  (zero visual change: it already used `bg-card`). `EarnButton`/`AddFundsBanner` use `--color-background-paper`
  (identical in light, `#1c1c1c` vs card `#171717` in dark) and `AccountHeader` is a transparent-on-colour
  outline — those stay grandfathered pending a design nod (a small dark-mode shift + a border), reviewable in
  the `UI/Button` story + Argos.

The button-level presets are **closed**: `size` and `className` are Omitted from their prop types, so
`<SubmitButton className="h-9">` / `<ActionButton className="rounded-lg">` are **compile errors** — a stronger
guard than lint (a human or AI cannot drift them). Layout is a semantic prop (`fullWidth`). Layout composites
(`ActionBar`, `DialogActions`) still take a `className`, but for layout only. The ESLint rule now also flags
size/skin `className` on `SubmitButton`/`ActionButton` as defense-in-depth (behind the type close, in case of an
`as any` bypass). The **only** sanctioned raw-styling escape is the primitive `<Button>` +
`// eslint-disable-next-line no-restricted-syntax -- <reason>`.

Remaining grandfathered `eslint-disable`s (11 files) are the backlog: the on-colour CTAs not yet migrated
(`EarnButton`, `AddFundsBanner`, `AccountHeader` — need a design nod, see `surface` above), the structural
`SplitMenuButton` split-join, and one-offs (`SafeAppActionButtons` pinned state, `QueuedTxSimulation`,
`SafeAccounts` filled-icon, `SidebarActionButton`, `AppearanceSection` theme cards, `WorkspaceBanner` link,
`HelpMenu` menu items, `SecurityChecks` inline toggle). Each maps to a future preset/variant (a menu-item size,
a link-reset, a card/toggle pattern) — adding it deletes its disable.

### Why this shape (industry consensus)

Researched across design-system practice; the approach converges on: **semantic props over style props**
(components own their look; don't forward arbitrary `className`), **variants/recipes not ad-hoc strings** with a
**rule of three**, **`className` for layout only, never semantic colour/skin**, **keep shadcn primitives in
`components/ui/*` separate from composites in `components/*`**, **closed components with a single visible escape
hatch**, and — for AI — **one tool-agnostic source of truth** (our `.storybook/AGENTS.md`), small and scoped,
that every AI tool points at rather than duplicating. Sources: shadcn customization discussion
(github.com/shadcn-ui/ui/discussions/9754), Infinum React/Tailwind/shadcn handbook, "React className
antipattern" (Kirichuk), and AI-rules guidance (ivanmorgillo.com, arxiv 2512.18925).

## Gotchas (these bit us — don't relearn them)

- **`--input` is `#fff` in light mode** (`styles/shadcn.css`) → `border-input` is an invisible white border
  in light. A visible field/button border **must** use `border-border` (`#e5e5e5` light / `#404040` dark).
  Never re-introduce `border-input` or hard-coded `border-gray-*` on a field/button.
- **Filled `secondary` is invisible on the muted page background** (only reads on white/card surfaces) →
  use `variant="outline"` for secondary actions on page/toolbar backgrounds (dashboard card is fine for `secondary`).
- **`Input` uses `inputSize`, not `size`** — native `<input size>` (a number) collides; `SelectTrigger`
  can use `size` because its props have no native `size`.
- **`SplitMenuButton` / `ComboSubmit`** (tx-flow submit) is full-width and takes **no `size` prop** — don't
  add `size` to it (type error); it manages its own width.
- **1Password SSH agent flakes in bursts** — signing ("failed to fill whole buffer") and `git push` (SSH)
  both fail together, then recover when you interact with the 1Password app. Retry; if blocked, commit with
  `git -c commit.gpgsign=false` (feature branch, fine) and push when it recovers. `gh` HTTPS token is
  **read-only** (push 403), so there is no HTTPS push fallback.
- Verify emits a "N files have no corresponding tests" advisory — that is informational, **not** a failure
  (check exit code 0). Story-title / className / variant changes don't need new unit tests.

## Next steps (prioritized)

1. **Search-field structural unification (design call).** Two patterns coexist: `common/SearchField`
   (Input + absolute icon + `pl-10`, h-10) used by AddressBook + Apps; and the `InputGroup` addon pattern
   used by spaces `SearchInput`, `AccountsSearch`, and the dropdown searches. The **InputGroup pattern is
   more-used + idiomatic → canonical.** Visual/token consistency is already handled (all default to
   `border-border` now), so what's left is the _structural_ choice + normalizing height (SearchField h-10 vs
   InputGroup h-9) and icon (size/color). Needs a designer nod on the canonical look before refactoring
   ~8 usages that carry behavioral nuance (debounce, responsive width).
2. **Finish the input audit tail.** The `input-analysis` Workflow produced 25 findings; 7 safe-fixes were
   applied. Re-run it (or read its output) and action/close the rest. Known **leave-with-justification**:
   the 66px heights (`TxFilterForm` fields + `AddressInput` — content-justified by the 32px avatar; a
   deliberate spacious-filter height), `CreateSpaceOnboarding` `h-11` (matches that flow's h-12 scale).
   Known **your-call**: `CurrencySelect` `SelectContent` uses `rounded-xl`+border vs the shared `rounded-md`+ring.
3. **Extend the method to the remaining families** the user cares about: checkbox/switch/radio, tabs,
   tooltip/popover, dialog/drawer/sheet, badge/chip, cards. Same recon → audit → variants → decide pipeline.
4. **Promote the render-sweep harness** (session scratchpad `render-sweep.mjs`: loads every story headless
   in light+dark, flags empty/error renders; + the `index.json` taxonomy assertions) into `scripts/storybook/`
   so CI/agents can run one command. Add a `--changed` scope.
5. **Storybook visual regression in CI — via Argos, not Chromatic** (org direction as of 2026-07-08):
   `.github/workflows/web-argos-storybook.yml` is wired; it only needs the `ARGOS_TOKEN_STORYBOOK`
   repo secret. ~~Turn on Chromatic in CI~~ (`@chromatic-com/storybook` + `chromatic.modes` are already wired in
   `preview.tsx`) — the highest-leverage guard for keeping this consistency from regressing. Needs a project token.

## Carried-over from the original PR (still open)

- **Two dev features to re-migrate to shadcn:** `SpacesList` require-login / `AccountInfo` header, and the
  full GTF `FeesPreview` fee UI.
- **Tx-flow re-port checklist:** dev's logic deltas on money-movement files were NOT blind-merged during the
  `dev` merge — see the collapsible checklist in the PR description ("For reviewers").
- **~46 unit tests** flagged in the PR need working through before un-drafting (map to the re-port checklist).
- **Two dead-code chips** were resolved: `CooldownButton` deleted; `SpaceCardNew` kept (active staged Spaces
  work) with a TODO.

## Where things live

- Primitives: `apps/web/src/components/ui/{button,input,input-group,select}.tsx`. Stories: `components/ui/stories/`.
- Storybook taxonomy + variant rules: `apps/web/.storybook/AGENTS.md`. Web principles: `apps/web/AGENTS.md`.
- The parallel shadcn-audit agent's handover: `apps/web/docs/SHADCN_COMPONENT_AUDIT.md`.
- Workflow/analysis scripts are in the session scratchpad (not committed) — re-create from the patterns above.
