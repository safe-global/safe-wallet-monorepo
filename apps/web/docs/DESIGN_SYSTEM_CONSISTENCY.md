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
5. **Turn on Chromatic in CI** (`@chromatic-com/storybook` + `chromatic.modes` are already wired in
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
