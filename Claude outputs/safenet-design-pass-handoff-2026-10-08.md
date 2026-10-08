# Handoff: Safenet design pass (PR #8957)

**Goal:** UI-only Safenet checks design pass on branch `austin/safenet-design-pass`, stacked on Florent’s [#8951](https://github.com/safe-global/safe-wallet-monorepo/pull/8951). Storybook is the source of truth; align copy and components with the [Wallet integration PRD](https://app.notion.com/p/3988180fe57381d2b43dc9b1b3488771) and [design pass feedback](https://app.notion.com/p/3f18180fe573812ea0b9e433420042f8).

**PR:** https://github.com/safe-global/safe-wallet-monorepo/pull/8957  
**Worktree:** `/Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass`  
**Branch:** `austin/safenet-design-pass`

---

## Local setup

| What                                           | How                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Storybook                                      | From repo root: `cd apps/web && yarn storybook` (port **6006**)          |
| Local Storybook base                           | http://localhost:6006/                                                   |
| App preview (deployed; stale until push)       | https://austin-safenet-design-pass--walletweb.review.5afe.dev/           |
| Storybook preview (deployed; stale until push) | https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/ |

**Protocol blocker (unchanged):** New Safenet contract (Oct 6); sentinels not on it yet → checks can start but may not finish with a real verdict until Florent/protocol confirms.

---

## What landed in the local commit (not pushed)

Single design-pass commit on top of `origin/austin/safenet-design-pass` (squashes prior local PRD copy fix with the rest of the pass):

1. **PRD copy** — Rule text from Florent’s plain-meaning table (`rejectionRules.ts`); no aggregate “malicious threats” headline when cited rules exist.
2. **Lighter details card** — Starts **collapsed** (no auto-expand on risk). Risks with rules show **only** `FlaggedRuleBlocks`. Removed six-rule `ChecksBlock` grid and sentinel vote summary. Proof links via `SafenetIconLink` (attestation vs explorer by state).
3. **Queue row chip removed** — Deleted `SafenetQueueStatus`, stories, tests; removed queue cell from `TxSummary` and feature contract.
4. **Storybook cleanup** — Removed **Queue**, **Transaction flow - Pro rollout off**, split new token/native transfer stories. One **New transaction review** per flow group. Group renamed to **Transaction details** (`pages-safenet-transaction-details--*`).
5. **Confirm flow** — `SafenetChecksSection` copy/layout; attestation/explorer icon links; secondary timing uses contrast tokens; **no time estimates** in UI.
6. **Timing helpers removed** — Deleted `checkTiming.ts`, `useCheckTiming.ts`, and related tests (no estimated durations in product copy).
7. **Storybook preview** — Minor decorator tweaks in `.storybook/preview.tsx` and `.storybook-vite/preview.tsx`.

**Intentionally not in this diff:** Auto-expand Safenet card on risk on live tx detail (Notion still mentions “opens on risk”; code **starts collapsed** everywhere).

---

## Git state (after 2026-10-08 commit)

| Item         | State                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| Branch       | `austin/safenet-design-pass`                                                        |
| vs origin    | **1 commit ahead**, **not pushed** (unless Austin asked to push after this handoff) |
| Working tree | Clean after commit                                                                  |
| Handoff      | This file — tracked under `Claude outputs/` (not gitignored)                        |

---

## Standing rules

| Rule           | Detail                                                              |
| -------------- | ------------------------------------------------------------------- |
| PRD copy       | User-facing rule text from PRD plain-meaning table only.            |
| Commits / push | **Only when Austin asks.** No push unless asked.                    |
| GPG            | Sign via **1Password**; never `--no-gpg-sign`.                      |
| PR hygiene     | Read dev-comments skill before PR comments/descriptions.            |
| External text  | Use write-like-austin for PR bodies, Slack, Linear, review replies. |

---

## Storybook sidebar

```
Pages
└── Safenet
    ├── Transaction flow - Active Pro plan
    │   ├── Confirm simulating
    │   ├── Confirm no issues found
    │   ├── Confirm risk detected
    │   ├── Confirm check failed
    │   └── New transaction review
    ├── Transaction flow - No Plan
    │   ├── Confirm transaction
    │   └── New transaction review
    └── Transaction details
        ├── Submitted
        ├── Simulating
        ├── No issues found
        ├── Risk detected
        ├── Risk detected several rules
        ├── Check failed
        └── No check
```

**Removed:** Queue, Pro rollout off, separate new token/native transfer stories.

---

## Story URLs

Slug pattern: `?path=/story/<group-slug>--<story-slug>`

### Local (`http://localhost:6006/`)

**Transaction details** (`pages-safenet-transaction-details--*`)

- Submitted — `/story/pages-safenet-transaction-details--submitted`
- Simulating — `/story/pages-safenet-transaction-details--simulating`
- No issues found — `/story/pages-safenet-transaction-details--no-issues-found`
- Risk detected — `/story/pages-safenet-transaction-details--risk-detected`
- Several rules — `/story/pages-safenet-transaction-details--risk-detected-several-rules`
- Check failed — `/story/pages-safenet-transaction-details--check-failed`
- No check — `/story/pages-safenet-transaction-details--no-check`

**Transaction flow - Active Pro plan** (`pages-safenet-transaction-flow-active-pro-plan--*`)

- Confirm simulating — `...--confirm-simulating`
- Confirm no issues found — `...--confirm-no-issues-found`
- Confirm risk detected — `...--confirm-risk-detected`
- Confirm check failed — `...--confirm-check-failed`
- New transaction review — `...--new-transaction-review`

**Transaction flow - No Plan** (`pages-safenet-transaction-flow-no-plan--*`)

- Confirm transaction — `...--confirm-transaction`
- New transaction review — `...--new-transaction-review`

### Preview (after push + deploy)

Prepend `https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/`

Example:  
https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/?path=/story/pages-safenet-transaction-details--risk-detected

---

## Next steps (Simon review)

1. **Storybook walkthrough** — Sidebar structure above; collapsed details card; no queue chip; Active Pro flows without stray workspace sign-in.
2. **Design open items** — Progress bar vs spinner + “In progress”; card scope vs History; submitted timing copy; 1/1 Safe “No, later” when Safenet on.
3. **When Austin asks to push** — Update Notion feedback page (drop Queue / Pro rollout sections, transaction-details slug, note collapsed default).
4. **Tests** — `cd apps/web && yarn test src/features/safenet-checks` (111 tests in safenet + TxSummary scope as of commit day).

---

## File map (key paths)

| Area                     | Path                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Queue row (chip removed) | `apps/web/src/components/transactions/TxSummary/`                        |
| Details card             | `apps/web/src/features/safenet-checks/components/SafenetDetailsCard.tsx` |
| Confirm flow             | `SafenetChecksSection.tsx`, `SafenetLinks.tsx`, `SafenetAuditRow.tsx`    |
| Rule copy                | `rejectionRules.ts`, `statusPresentation.ts`                             |
| Feature export           | `feature.tsx`, `types.ts`                                                |
| Storybook                | `apps/web/src/stories/pages/safenet/`                                    |
| Preview                  | `apps/web/.storybook/preview.tsx`, `.storybook-vite/preview.tsx`         |

---

## ChatGPT starter prompt

```
I'm continuing Safenet design-pass work for Safe Wallet PR #8957.

Read this handoff first:
/Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass/Claude outputs/safenet-design-pass-handoff-2026-10-08.md

Worktree: /Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass
Branch: austin/safenet-design-pass

Git: design-pass work is in one local commit ahead of origin (not pushed). Do not push unless I explicitly ask.

Top priorities:
1. Help Simon review in Storybook (localhost:6006) — walk Transaction details and confirm-flow stories using the sidebar in the handoff.
2. Draft PR #8957 / Notion updates for the trimmed sidebar (no Queue, no Pro rollout, Transaction details slug, collapsed card default).
3. Resolve open design questions on the Notion feedback page (progress vs spinner, card scope, timing copy).

Standing rules: PRD table copy only; GPG via 1Password if I ask for commits; no push without my say-so.

Start by summarizing what's in the unpushed commit vs origin, then propose a Simon review checklist story-by-story.
```

---

## Codex starter prompt

```
I'm continuing Safenet design-pass work for Safe Wallet PR #8957.

Read this handoff first:
/Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass/Claude outputs/safenet-design-pass-handoff-2026-10-08.md

Worktree: /Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass
Branch: austin/safenet-design-pass

Git: design-pass work is in one local commit ahead of origin (not pushed). Do not push unless I explicitly ask.

Top priorities:
1. Help Simon review in Storybook (localhost:6006) — walk Transaction details and confirm-flow stories using the sidebar in the handoff.
2. Draft PR #8957 / Notion updates for the trimmed sidebar (no Queue, no Pro rollout, Transaction details slug, collapsed card default).
3. Resolve open design questions on the Notion feedback page (progress vs spinner, card scope, timing copy).

Standing rules: PRD table copy only; GPG via 1Password if I ask for commits; no push without my say-so.

Start by summarizing what's in the unpushed commit vs origin, then propose a Simon review checklist story-by-story.
```
