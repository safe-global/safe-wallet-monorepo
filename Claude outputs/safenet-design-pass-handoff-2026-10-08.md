# Handoff: Safenet design pass (PR #8957)

**Goal:** UI-only Safenet checks design pass on branch `austin/safenet-design-pass`, stacked on Florent’s [#8951](https://github.com/safe-global/safe-wallet-monorepo/pull/8951). Storybook is the source of truth; align copy and components with the [Wallet integration PRD](https://app.notion.com/3988180fe57381d2b43dc9b1b3488771) and [design pass feedback](https://app.notion.com/p/3f18180fe573812ea0b9e433420042f8).

**PR:** https://github.com/safe-global/safe-wallet-monorepo/pull/8957  
**Worktree:** `/Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass`  
**Branch:** `austin/safenet-design-pass`

---

## Local setup

| What                         | How                                                                      |
| ---------------------------- | ------------------------------------------------------------------------ |
| Storybook                    | From repo root: `cd apps/web && yarn storybook` (port **6006**)          |
| Local Storybook base         | http://localhost:6006/                                                   |
| App preview (deployed)       | https://austin-safenet-design-pass--walletweb.review.5afe.dev/           |
| Storybook preview (deployed) | https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/ |

**Protocol blocker (unchanged):** New Safenet contract (Oct 6); sentinels not on it yet → checks can start but may not finish with a real verdict until Florent/protocol confirms.

---

## Commits on origin (pushed 2026-10-08)

Two commits ahead of the prior remote tip (`58714338a`):

| SHA         | Summary                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `702be1e11` | **feat(safenet): align design pass with PRD and Storybook review** — PRD rule copy; lighter **collapsed** details card (rules-only flagged blocks, icon proof links); queue row chip removed; Storybook trimmed to Active Pro / No Plan / **Transaction details**; confirm-flow copy and contrast tokens; timing helpers removed; no time estimates in UI. |
| `1f8419506` | **fix(safenet): improve details card secondary text and BENIGN line** — receipt-style meta tokens on the inset card; BENIGN state shows outcome + verified timestamp on one line.                                                                                                                                                                          |

**Intentionally not in this diff:** Auto-expand Safenet card on risk on live tx detail (Notion still mentions “opens on risk”; code **starts collapsed** everywhere).

---

## Git state

| Item         | State                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Branch       | `austin/safenet-design-pass`                                                 |
| vs origin    | **Pushed** — `origin/austin/safenet-design-pass` includes both commits above |
| Working tree | Clean                                                                        |
| Handoff      | This file — tracked under `Claude outputs/`                                  |

---

## Simon feedback — actioned (summary)

- **Storybook scope** — Removed Queue, Pro rollout off, and duplicate new-token/native stories; one **New transaction review** per flow group; **Transaction details** group for tx-detail states.
- **Details card** — Collapsed by default; flagged rules only (no six-rule grid / sentinel vote summary); attestation vs explorer icon links by state.
- **Copy** — Rule text from PRD plain-meaning table; no aggregate “malicious threats” headline when rules are cited; no duration estimates in product copy.
- **Queue** — Safenet queue chip and related stories/tests removed from the tx list row.
- **Polish (follow-up commit)** — Secondary/meta typography on the details card; BENIGN outcome line layout.

**Notion:** [Design pass feedback](https://app.notion.com/p/3f18180fe573812ea0b9e433420042f8) updated to match trimmed sidebar, transaction-details slug, and collapsed card default.

---

## Standing rules

| Rule           | Detail                                                              |
| -------------- | ------------------------------------------------------------------- |
| PRD copy       | User-facing rule text from PRD plain-meaning table only.            |
| Commits / push | **Only when Austin asks.**                                          |
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

### Preview (after deploy)

Prepend `https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/`

Example:  
https://austin-safenet-design-pass--walletweb.review.5afe.dev/storybook/?path=/story/pages-safenet-transaction-details--risk-detected

---

## Next steps

1. **Simon review** — Walk Storybook (local or preview) using the sidebar above; focus on collapsed details card, confirm flows, and BENIGN / risk copy.
2. **Preview** — After push, **Web Deploy to dev/staging** (`web-deploy-dev.yml`) runs on PR #8957 and rebuilds branch preview + Storybook (watch PR comment “Branch preview”).
3. **Design open items** — Progress bar vs spinner; card scope vs History; submitted timing copy; 1/1 Safe “No, later” when Safenet on (see Notion feedback page).
4. **Tests** — `cd apps/web && yarn test src/features/safenet-checks` (safenet + TxSummary scope).

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

Git: origin is up to date with 702be1e11 (design pass) and 1f8419506 (details card typography / BENIGN line). Do not push unless I explicitly ask.

Top priorities:
1. Support Simon's Storybook review — Transaction details + Active Pro / No Plan confirm flows (sidebar in handoff).
2. Track remaining open design items on Notion (progress vs spinner, card scope, timing copy).
3. If I ask for changes, keep PRD table copy only and GPG via 1Password for commits.

Start by confirming preview URLs are fresh (PR #8957 web-deploy-dev), then offer a story-by-story review checklist for Simon.
```

---

## Codex starter prompt

```
I'm continuing Safenet design-pass work for Safe Wallet PR #8957.

Read this handoff first:
/Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass/Claude outputs/safenet-design-pass-handoff-2026-10-08.md

Worktree: /Users/austin/Developer/Safe/_worktrees/safe-wallet-monorepo/safenet-design-pass
Branch: austin/safenet-design-pass

Git: origin is up to date with 702be1e11 (design pass) and 1f8419506 (details card typography / BENIGN line). Do not push unless I explicitly ask.

Top priorities:
1. Support Simon's Storybook review — Transaction details + Active Pro / No Plan confirm flows (sidebar in handoff).
2. Track remaining open design items on Notion (progress vs spinner, card scope, timing copy).
3. If I ask for changes, keep PRD table copy only and GPG via 1Password for commits.

Start by confirming preview URLs are fresh (PR #8957 web-deploy-dev), then offer a story-by-story review checklist for Simon.
```
