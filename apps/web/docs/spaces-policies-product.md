# Spaces → Policies — Product brief & user stories

> Companion to the technical/QA doc at [`spaces-policies.md`](./spaces-policies.md). This file is the **product** view: what we're building, for whom, why, and what "good" looks like.

---

## 1. One-line pitch

> **Safe Spaces gets a Policies page** — one place for an organisation to grant scoped permissions (spending limits, recovery) across every Safe it operates, and audit them at a glance.

---

## 2. Why this exists

Today, an org running 3+ Safes inside a Space has to:

- Open each Safe individually to know whether a spending limit or a recovery setup exists.
- Re-enter the same beneficiary / cooldown / expiry over and over per Safe.
- Trust tribal knowledge to remember which Safe has what.

For ops and treasury teams this is **slow**, **error-prone**, and **invisible to non-signers** (compliance, finance, board observers).

**Policies** makes the workspace itself the auditable surface. One page, all Safes, all policies, with the same creation flow.

---

## 3. Target users

| Persona                  | What they do                                                                                      | What they need from Policies                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Treasury / Ops Lead**  | Decides who can spend what. Owns the policy surface.                                              | Set up spending limits and recovery in minutes, see everything at once, revoke quickly. |
| **Workspace Admin**      | Adds Safes to the Space, manages teams.                                                           | Confirm that every Safe in the workspace has the right guard rails.                     |
| **Designated Spender**   | A team lead, contractor, or automation bot that needs recurring access without bothering signers. | Trust that the cap is enforced; transparency on what they're allowed to spend.          |
| **Safe Signer**          | Owner of one or more multisigs in the Space.                                                      | Co-sign policy creation; see the policies that affect their Safe.                       |
| **External Recoverer**   | A backup wallet, law firm, or independent custodian.                                              | Be configured by the team; act if recovery is triggered.                                |
| **Compliance / Auditor** | Read-only stakeholder.                                                                            | Pull up the page during a review and see all delegated permissions across the Space.    |

---

## 4. Outcomes we're targeting

| Outcome                                                                            | Why it matters                                                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Time-to-first-policy < **3 minutes**                                               | If it takes longer than booking a Slack huddle, ops will keep using the old per-tx flow. |
| **Zero context-switching** across Safes when setting up the same kind of policy    | Most orgs apply the same recovery + spending pattern across all their Safes.             |
| Live, accurate read of **on-chain state** (no "last seen" caches)                  | Compliance won't trust a stale view; ops won't trust a stale view either.                |
| Recoverable from any "weird" Safe state (uncommon module versions, partial setups) | Real-world Safes have heterogeneous modules. Silently hiding them undermines trust.      |

---

## 5. Product overview

The Policies page lives in the Spaces sidebar (between **Team** and **Security**, slot already exists). It's split into two halves:

### **Add a policy** (top, always visible)

Three tiles, one per policy type:

- **Spending Limit** — _Per-member spending cap._ Free tier.
- **Operator Role** — _Scoped DeFi permissions._ **Coming soon** (visual placeholder).
- **Account Recovery** — _Recover lost access._ Free tier.

Clicking an available tile starts a guided wizard.

### **Active policies** (below, dynamic)

Lives data from every Safe in the Space:

- One compact row per `(Safe × policy type)` combination that's actually deployed.
- Each row leads with the Safe identicon + name, then a one-line policy summary.
- Tap to expand → see spenders, tokens, amounts, reset clocks, recoverers, cooldowns, expiry — whatever's relevant for that policy type.
- A scrollable **"Scanned N safes in this space"** footer lists every Safe that was checked, so the user knows what was looked at — never a silent empty.

---

## 6. Epic 1 — **Set up a Spending Limit**

> _As an ops lead, I want to grant a teammate or bot recurring spend authority on a Safe, so they don't bottleneck on multi-sig for every payment._

### The 4-step wizard

1. **Spender** — Pick the signer who will be allowed to spend.
2. **Tokens** — Pick which tokens they can move.
3. **Amount** — Set a USD cap and a reset period (day / week / month).
4. **Review** — Confirm and sign.

A sticky **Policy summary** on the right fills in as the user answers, so they never lose track of what they're about to deploy.

### User stories

#### US-SL-1 · Pick a spender

**As an** ops lead
**I want to** see a list of my Safe's signers and pick one
**So that** I can grant them recurring access without typing addresses

**Acceptance**

- The wizard lists every signer of the chosen Safe.
- I can pick exactly one; selection is visually obvious.
- The right-column summary updates immediately with the spender's identicon + short address.
- I cannot proceed to step 2 without a selection.

#### US-SL-2 · Pick one or more tokens

**As an** ops lead
**I want to** select the tokens this spender is allowed to use
**So that** I limit blast radius (e.g. USDC only, no ETH)

**Acceptance**

- Tokens are sorted by my Safe's current balance.
- I have quick-pick pills for **Stablecoins**, **Native**, and **Clear**.
- I can paste a contract address to add a custom token.
- The right-column summary shows the picked tokens as logo + symbol chips.
- I cannot proceed without at least one token.

#### US-SL-3 · Set a single USD cap that applies to all picked tokens

**As an** ops lead
**I want to** set "$5,000 per week" once and have it convert per token at sign time
**So that** I don't have to think in ETH/USDC/DAI separately

**Acceptance**

- A single `$` amount input drives the limit for every priced token.
- Tokens without a live oracle price (e.g. some long-tail ERC-20s) get their own inline input.
- A segmented control flips between **Day / Week / Month**.
- The right-column summary breaks down the cap per token (e.g. `ETH 2.99 / USDC 5,000`) so I see exactly what I'm authorising.
- I cannot proceed if any picked token still has no usable amount.

#### US-SL-4 · Review and sign once

**As an** ops lead
**I want to** see a final summary and sign exactly once
**So that** I know what's about to be deployed and don't accidentally double-fire

**Acceptance**

- Step 4 shows the full policy: Safe, Spender, Limits per period, Enforced by, Signature threshold, signers.
- It also shows my Safe's signature threshold (e.g. _"2 of 3 signers must approve this policy on-chain"_).
- Clicking **Sign & create** opens the normal Safe queue.
- After successful submission, I land back on `/spaces/policies` and the new policy appears in **Active policies** within ~30s of confirmation.

#### US-SL-5 · Back out from any step

**As an** ops lead
**I want to** click "Back" to go to the previous step, or "Policies" from step 1 to exit
**So that** I can abandon or rewind a setup without losing typed data

**Acceptance**

- **Back** on steps 2–4 returns to the previous step with all data intact.
- **Back** on step 1 reads "Policies" and exits the wizard.
- The URL reflects the current step at all times so a refresh keeps me in place.

---

## 7. Epic 2 — **Set up Account Recovery**

> _As an ops lead, I want a designated recoverer who can rotate signers if our team loses access, so a single-point-of-failure doesn't lock us out of millions of dollars in treasury._

### The 5-step wizard

1. **Apply to** — Pick which Safe in the Space gets the recovery setup.
2. **Recoverer** — Enter the address (or ENS) of the trusted recoverer + an optional nickname.
3. **Cooldown** — Choose how long the review window is (24h / 7d / 14d / 28d **recommended** / 60d / Custom).
4. **Expiry** — Choose when the recovery option auto-expires (Never **recommended** / 6 months / 1 year / Custom date).
5. **Review & sign**.

### User stories

#### US-RC-1 · Choose which Safe

**As an** ops lead
**I want to** select one Safe in my Space to apply recovery to
**So that** I can roll out recovery Safe by Safe, starting with the highest-value one

**Acceptance**

- Step 1 shows every Safe in the Space using the same row visual as the Accounts page (blocky identicon + name + short address with copy button).
- Multi-chain Safes appear once per chain.
- I can pick exactly one Safe.

#### US-RC-2 · Enter a recoverer with ENS support

**As an** ops lead
**I want to** type `recoverer.ourdao.eth` or paste a hex address
**So that** I'm not transcribing 0x… by hand

**Acceptance**

- The input accepts both ENS and 0x.
- ENS resolution is debounced and visibly shows **Resolving…** while in flight.
- On success: a green **✓ Valid** pill, plus a monospace sub-line "Resolves to `0xd8dA…6045`".
- On failure (after resolution settles): a red "Enter a valid address or ENS." — does **not** flicker mid-typing.
- I can give the recoverer a friendly nickname (e.g. _"Dev backup wallet"_) that appears later in the Policies overview.
- A trust tip explains: _"Pick an address you can always access."_

#### US-RC-3 · Pick a sensible cooldown with a clear default

**As an** ops lead
**I want to** see "28 days" pre-recommended and a range of alternatives
**So that** I don't have to guess what's safe vs aggressive

**Acceptance**

- Six options, presented as a clean radio list (not chunky cards).
- **28 days** is labelled `RECOMMENDED`.
- **Custom** reveals an inline `[ N ] days` input when selected.
- Continue is disabled when **Custom** is selected with no value, or `0`.

#### US-RC-4 · Choose how the recovery option expires

**As an** ops lead
**I want to** keep recovery active until I remove it, OR auto-expire it after a period
**So that** I can scope a temporary arrangement (e.g. ahead of a known absence) without forgetting to revoke

**Acceptance**

- Four options: **Never** (`RECOMMENDED`), 6 months, 1 year, Custom date.
- **Custom date** reveals a native date picker with `min=tomorrow` so I can't pick a past date.
- Continue is disabled when Custom date is unset.

#### US-RC-5 · Review the human-readable plain-English summary

**As an** ops lead
**I want to** see the full policy in one sentence in plain English
**So that** I can read it back to a colleague before signing

**Acceptance**

- A green-gradient hero card on step 5 reads, e.g.:
  > **Dev Backup Wallet** (0x1184…81BE) can recover **Operations**. They can propose a signer rotation, which executes after a **28 days** review window. This option **never expires**.
- Below the hero, a 2×2 grid shows Safe / Recoverer / Review window / Expires for a structured read.
- An "Enforced by Safe Delay Modifier · Audited, on-chain enforced" footer line.

> ⚠ Submission is a **stub** in this PR — the wizard returns to the policies grid after 600 ms. Deploying the Delay Modifier is intentionally out of scope for v1.

---

## 8. Epic 3 — **Audit applied policies at a glance**

> _As a workspace admin or compliance reviewer, I want to land on Spaces → Policies and immediately see what's deployed across every Safe in the Space, so I don't have to chase signers for a status update._

### User stories

#### US-AP-1 · See every applied policy across the Space, live

**As a** workspace admin
**I want to** open `/spaces/policies` and see all the spending limits + recovery setups across all my Safes
**So that** I get a single audit surface without clicking into each Safe

**Acceptance**

- The page scans every Safe in the Space in parallel.
- A row appears per `(Safe × policy type)` pair that's actually configured on-chain.
- The data is fresh (read directly from the AllowanceModule and Delay Modifier contracts, not from a cache).
- A pulsing dot + **"Scanning N safes…"** indicator is shown while scans are in flight; replaced by an integer count when settled.

#### US-AP-2 · Identify which Safe a policy belongs to at first glance

**As a** workspace admin
**I want to** see the Safe's blocky identicon + name leading the row
**So that** if my Space has 5 Safes with the same policy type, I can tell them apart instantly

**Acceptance**

- Each row leads with a 36 px blocky `SafeIdenticon` (same one the Accounts page uses).
- The Safe name and short address sit at the top of the row text block.
- Policy type ("Spending Limit" / "Account Recovery") is the secondary line.
- An **ACTIVE** pill on the right with a pulsing green dot.

#### US-AP-3 · Drill into a policy without leaving the page

**As a** workspace admin
**I want to** click a row to expand its detail in place
**So that** I can review specifics without losing my scroll position or page state

**Acceptance**

- A chevron rotates on click; the row expands inline.
- For Spending Limit: one block per spender, with address-book name if available, plus a list of per-token rows (`spent of amount` + reset time).
- For Account Recovery: review-window + expiry tiles, plus the recoverer list.
- A second click collapses the row.

#### US-AP-4 · See the right name when it's known

**As a** workspace admin
**I want to** see "Dev" or "Payroll bot" rather than `0x74C5…19Ff`
**So that** my mental model of who has access is human-readable

**Acceptance**

- Spender and recoverer addresses are looked up via my address book (Space + local).
- When a name is found, it's the bold first line above the short address.
- When there's no name, only the short address shows.

#### US-AP-5 · Understand why a policy didn't load

**As a** workspace admin
**I want to** see clearly when a policy is partially set up or failed to read
**So that** I'm not left wondering if "no policies" means "none deployed" or "we have a bug"

**Acceptance**

- If a Safe has the AllowanceModule installed but **no spenders configured**, the row reads:
  > Spending Limit · module enabled · no spenders
- If the on-chain read fails, the row reads:
  > Spending Limit · failed to load
  > And the expanded view shows the actual error.
- If a Safe has zero policies, the page shows a dashed empty-state card:
  > No policies applied to the N safes in this space yet.

#### US-AP-6 · Confirm what was scanned

**As a** workspace admin
**I want to** see exactly which Safes were checked, with their module count
**So that** if my Safe isn't appearing, I can tell whether it's missing from the Space or my data is just stale

**Acceptance**

- A foldable **"Scanned N safes in this space"** footer lists every Safe with: identicon, name, short address, module count, `ALLOWANCE` badge if applicable, `OTHER MODULE` badge if applicable.
- Auto-expanded when zero policies are found.
- Manually expandable/collapsible at any time via a chevron.

---

## 9. Epic 4 — **Remove a spending limit**

> _As an ops lead, I want to revoke a spender's access quickly when they leave the team, without leaving the policies page or hunting through per-Safe settings._

### User stories

#### US-RM-1 · One-click revoke from the audit view

**As an** ops lead
**I want to** click a trash icon next to a token row to start removing that spender's limit
**So that** I can offboard quickly during a security incident

**Acceptance**

- Each token row inside an expanded spending-limit policy shows a trash icon at the right edge.
- The icon is subtle by default (50 % opacity), shifts to red on hover.
- Clicking it does NOT collapse the row.
- It opens the canonical `RemoveSpendingLimitFlow` modal, pre-loaded with the right spending limit.
- The modal walks me through queue → sign → execute as I'd expect from any Safe tx.

#### US-RM-2 · Same Safe context whether the modal opens from a Safe page or the Policies page

**As an** ops lead
**I want to** the removal modal to behave the same way it does on the per-Safe settings page
**So that** I don't have to learn two workflows

**Acceptance**

- The modal shows the right Safe's name, threshold, owners.
- After successful execution, my Active policies row updates within ~30s.

---

## 10. Cross-cutting acceptance

### Layout & responsiveness

- The two wizards share the same 3-column shell: numbered step indicator on the left, form in the center with **Back / Continue** at the top, sticky **Policy summary** on the right.
- The policy summary updates **as the user answers each step** (live), not at the end.
- Below `md` breakpoint, the wizard collapses to single-column; the right-side summary is hidden (acceptable v1 trade-off).

### Empty + loading states

- "Scanning N safes…" is the loading state for the Active policies section.
- A dashed empty-state card explains zero results, with the number of Safes scanned.
- A foldable Scanned-safes footer always provides full transparency.

### Errors

- Per-row failures show inline, never break the whole page.
- The error message is the literal exception text, surfaced to help support triage (e.g. _"invalid bytes32 – not 32 bytes long"_).

### Address book integration

- Every address (spenders, recoverers) is name-resolved via the user's space + local address books.
- When a name is available, it's the bold first line; the short address sits below.

---

## 11. Success metrics

These are the metrics product / analytics should instrument before GA:

| Metric                                                                                | Target              | How to measure                                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| % of Spaces with ≥1 policy applied within 30 days of feature exposure                 | 25 %                | Count Spaces where `useSafeSpendingLimits` or `useSafeRecovery` returns ≥1 result, divided by total active Spaces |
| Median time from "Spending Limit" tile click → policy executed                        | < 3 min             | Analytics events on tile click and tx execute                                                                     |
| Wizard drop-off rate per step                                                         | < 20 % per step     | Step-transition events                                                                                            |
| % of users who use the **Custom** option in Cooldown or Expiry                        | tracking only       | Helps validate whether the recommended defaults are usable                                                        |
| % of policy creations that come from `/spaces/policies` vs the per-Safe settings page | growing toward 75 % | Source attribution on the tx create event                                                                         |
| Page-level error rate (any "failed to load" row shown to a user)                      | < 1 %               | Surface error counter from the hooks                                                                              |

---

## 12. Out of scope (this PR)

These are explicit non-goals for the current shipment:

- **Operator Role wizard.** Tile is visible with a "Coming soon" pill, no click handler.
- **Recovery submission.** The wizard collects all the data and stubs the submit. A future PR wires up Delay Modifier deployment + enablement.
- **Custom cooldown / custom date persistence.** Stored in component state and reflected in the right-column summary, but not yet wired into the on-chain payload (waiting on real submission).
- **Mobile design polish.** Functional below `md` but the right-column summary is hidden.
- **Bulk operations.** No "apply this policy to all Safes in the Space" yet — each Safe is configured individually.
- **Notifications.** No alerts when a policy is about to expire, or when a recoverer triggers a queue.

---

## 13. Risks & mitigations

| Risk                                                                                    | Mitigation in this release                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User has v0.1.1 AllowanceModule on a chain not registered in the SDK's deployment JSON. | `findInstalledAllowanceAddress` resolves the address from the Safe's own modules array, so the chain registration is not required. (See QA doc §10 for the long form.)                             |
| Per-Safe scans are heavy on chains with slow RPC.                                       | Each scan is independent and reports its own loading state; the page never blocks on the slowest one.                                                                                              |
| User confuses "Coming soon" Operator Role for something they can click.                 | Pulsing green pill clearly labels it; tile is dimmed and has no click handler.                                                                                                                     |
| Recovery submission stub looks like a bug.                                              | The wizard simulates 600 ms then returns to the grid — visually feels "submitted" so users testing won't think it's broken. Will be replaced by real submission in a follow-up; documented in §12. |

---

## 14. Glossary (product-facing)

- **Space** — A workspace in Safe{Wallet} that contains multiple Safes + team members + an address book.
- **Policy** — A delegated permission applied to a Safe (Spending Limit, Account Recovery, future Operator Role).
- **Spender** (a.k.a. _Beneficiary_ in v0.1.x AllowanceModule, _Delegate_ in some literature) — The address authorised to move funds within the limit.
- **Reset period** — How often the spending cap refreshes (Day / Week / Month / one-time).
- **Recoverer** — The address authorised to propose a signer rotation if the team loses access.
- **Review window** (a.k.a. _Cooldown_ in the Delay Modifier) — Time between recovery being triggered and signers being rotated. During this window the existing signers can cancel.
- **Auto-expiry** — When the recovery option itself becomes invalid if unused (`txExpiration` on the Delay Modifier).
- **Active policy** — A policy that the on-chain read currently reports as configured.
- **Scanned** — A Safe that the page has attempted to read policies from this session, whether or not it had any.

---

## 15. Open questions for product

These need product/design decisions before the next iteration:

1. Should we let users **bulk-apply** the same Spending Limit to every Safe in the Space in one wizard?
2. Should the Active policies section also show **historic / revoked** policies as faded entries, or hide them entirely once removed?
3. For Recovery: should the **default Cooldown** stay at 28 days, or shift to 14 days for smaller teams (we currently have no segmentation)?
4. Should we surface **gas estimates per Safe** at wizard step 4 / 5, given different chains have wildly different costs?
5. When a policy is about to expire (e.g. < 7 days), should we surface a banner on the Policies page or only an email/in-app notification?

---

_Last updated: 2026-05-20_
