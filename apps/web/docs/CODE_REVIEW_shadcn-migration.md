# Code review — `feat/shadcn-migration` vs `dev`

**Verdict: do not merge as-is.** Four P0 defects, one of which is a hard crash on a surface every
transaction flow renders, and one of which is a silent feature deletion whose tests were rewritten
to pass.

- Scope: 1339 files, +38 457 / −34 049. 791 real source files after excluding stories, docs, snapshots.
- MUI + Emotion removal is clean: zero residual `@mui/` or `@emotion` imports in `apps/web/src`.
- Merge-base: `a9bb51ae34a746d9df9475352fb49273bddf0990`

## Method, and what that means for confidence

10 finder angles over partitioned surfaces (tx pipeline, ui primitives, `components/common`,
spaces/accounts, security, removed-behaviour, DRY, architecture, tests/a11y, footgun sweep).
Every surviving candidate then got **two independent agents**: one instructed to _refute_ it, one to
size impact and check whether `dev` already had the defect. 54 agents, 0 failures.

- 19 candidates survived adversarial verification → consolidated to **15** (three were found twice).
- **3 refuted** — see [Refuted](#refuted-with-the-counter-argument-that-killed-them).
- **45 dropped** at lower severity _without_ verification — see [Unverified tail](#unverified-tail).

**Confidence caveat:** three verifier agents I ran against my own findings died on `529 Overloaded`
and I did not re-run them. The one finding that never got an independent challenge is the
media-query first-render issue (in the unverified tail, not in the 15).

Confidence column below: **CONFIRMED** = mechanism verified in code, often by executing it.
**PLAUSIBLE** = mechanism verified but the refuter raised unresolved doubt about reachability or impact.

---

## P0 — block merge

### 1. Nonce dropdown crashes the app and wipes a typed nonce

`apps/web/src/components/tx-flow/common/TxNonce/index.tsx:165` · correctness · **CONFIRMED** · risk: **critical**

Two defects in one JSX block. `ComboboxLabel` (Base UI `GroupLabel`) is rendered outside any
`ComboboxGroup`, which throws when the list opens. Behind it, the combobox is controlled only via
`inputValue` with no `value`/`onValueChange`, so Base UI's single-selection close handler resets the
input to the empty selected value.

**Why it matters:** `TxNonce` is rendered from `TxLayoutBase:47` — the shared chrome for _every_ tx
flow: send tokens, send NFT, swap, add/remove/replace owner, change threshold, tx-builder, batch,
safe-app tx, replace-tx.

**If we don't fix it:** clicking the nonce field on any review screen is a full-page error boundary
and the user loses the transaction they were assembling. With the crash fixed, the second defect
surfaces: type nonce 42, open and close the dropdown, field silently resets — the user signs with
the auto nonce, so a transaction meant to _replace_ a stuck one gets queued as a new one instead.

**Fix:** wrap the list contents in `ComboboxGroup` (already exported), and bind selection with
`value`/`onValueChange` instead of `inputValue` alone.

**Counter-argument:** the nonce-wipe scenario is unreachable _as written_, because the crash fires
first. That reorders the two fixes; it does not remove either.

---

### 2. GTF fees panel gutted — total outgoing and insufficient-balance warning deleted

`apps/web/src/features/gtf/components/FeesPreview/index.tsx:51` · regression · **CONFIRMED** · risk: **critical**

Cut from 395 → 71 lines. Deleted: pay-fees-from (Safe/Signer) selector, gas-token selector,
execution-fee row, "Total outgoing" section, insufficient-gas-token-balance warning.
`useFeesPreview` is **unchanged** and still computes all of it — `canCoverFees` goes from 6 uses to
0; `setGtfPaymentMode` and `onGasTokenChange` now have no production call site.

**Why it matters:** `FeesPreview` renders unconditionally inside `ReviewTransactionComponent`
(`TxFlow.tsx:102`), the shared review step for all SafeTx flows.

**If we don't fix it:** on GTF chains a signer sees only a gas-fee row. They cannot see the total
amount leaving the Safe, cannot choose the fee token, and get **no warning when the Safe cannot
cover fees** — they sign a Safe-pays payload while nothing on screen says the Safe is paying.

**Fix:** re-port dev's phase-2 panel in shadcn form, or explicitly descope GTF behind its flag and
delete the now-dead hook outputs. This needs a product decision, not just a patch.

**Counter-argument:** this is _acknowledged_, not accidental — `FeesPreview.test.tsx:6-9` carries a
NOTE saying the simplified panel is deliberate and "flagged for re-port". That is exactly why it is
listed as P0: the test file was rewritten from ~160 lines to two trivial assertions, so CI is green
over a deleted feature and nothing will remind anyone.

---

### 3. Approval amount resets when the preset dropdown closes

`apps/web/src/components/tx/ApprovalEditor/ApprovalValueField.tsx:53` · correctness · **CONFIRMED** · risk: **critical**

Same uncontrolled-selection shape as #1 — no `value`/`onValueChange` — so closing the preset
dropdown resets the edited approval amount to `''`.

**If we don't fix it:** a dApp requests an ERC-20 approval over WalletConnect. The user edits the
allowance to `123 TST`, opens the preset dropdown to compare, closes it — the field wipes. A wiped
sibling row makes `updateApprovalTxs` throw silently, so the row still _displays_ `123 TST` while
the `safeTx` being signed still encodes the dApp's original (often unlimited) allowance. **The user
signs an approval materially different from what the screen shows.**

**Fix:** `value={value ?? ''}` + `onValueChange` bound to the RHF field.

**Counter-argument:** the "resets back to a previously picked preset such as Unlimited" variant does
not reproduce — Base UI nulls `selectedValue` first. The reset-to-empty path does reproduce, and it
is the one that causes the display/payload divergence.

---

### 4. Contact suggestion list never closes; clicking away sets the recipient

`apps/web/src/components/common/AddressBookInput/index.tsx:95` · correctness · **CONFIRMED** (executed) · risk: **high**

MUI `Autocomplete` was replaced with a hand-rolled absolutely-positioned listbox with **no**
close-on-blur, no close-on-outside-click, no Escape handling and no keyboard navigation. It sits at
`z-index: var(--z-overlay)` over the rest of the form, and the only way to dismiss it is to click an
option — which writes that contact's address as the recipient.

**Verified by execution**, not reading: a throwaway test printed `after blur, listbox present: true`,
`after outside click: true`, `after Escape: true`, and a following stray click on option "Bob" wrote
Bob's address into the field.

**Why it matters:** 9 render sites, all address-entry forms — `TokenTransfer/RecipientRow:118`,
`NftTransfer/SendNftBatch:100`, `AddOwner/ChooseOwner`, and 6 more.

**If we don't fix it:** a user clicks into the recipient field, then reaches for the Amount field —
and that click substitutes an address-book contact as the recipient with no confirmation. One
Review-screen skim from a real transfer to the wrong address.

**Fix:** port the dismissal effect that already exists on this branch at
`NetworkSelector/NetworkMultiSelectorInput.tsx:38-58`.

**Counter-argument:** MUI's `useAutocomplete` also `preventDefault`s on listbox mousedown, so a
click-lands-on-a-contact mis-selection was _partly_ possible on `dev` too. The three missing
dismissal paths are new.

---

## P1 — before release

### 5. `Button`'s anchor path silently discards `disabled`

`apps/web/src/components/ui/button.tsx:95` · regression · **CONFIRMED** (executed) · risk: **high**

The new `isAnchorRender` fast-path returns `cloneElement(render, {...props})`, bypassing
`ButtonPrimitive`/base-ui `useButton` entirely. Every disabled semantic is lost: no click blocking,
no `aria-disabled`, no `tabindex` management, no disabled styling (Tailwind's `disabled:` compiles to
`&:disabled`, which never matches `<a disabled>`).

Rendering `<Button disabled render={<NextLink href="/x"/>}>` emits `<a disabled data-slot="button">`
with `aria-disabled: null` and **the onClick handler firing**.

**If we don't fix it:** live at `tx-flow/flows/SuccessScreen/index.tsx:129`. While a nested-Safe
deployment is PROCESSING/RELAYING/INDEXING, `disabled={!isSuccess}` is discarded, so "Go to Nested
Safe" renders as a full-opacity primary CTA. Clicking it fires `onClick={onClose}`, tearing down the
status modal mid-deployment and navigating to an undeployed Safe. The same trap is latent across
~40 anchor-render call sites.

**Fix:** in the primitive, not the call site — pull `disabled` out of `...props` and translate it to
anchor semantics (`aria-disabled`, `tabIndex={-1}`, click guard, `pointer-events-none`).

**Counter-argument:** the predicted address is deterministic CREATE2, so the user lands on the
_correct_ address and counterfactual Safes are a supported state — this is a lying affordance, not
funds at risk. The second cited call site (`SafeAppLandingPage/AppActions.tsx:68`) is a dead prop.

### 6. Private-key dialog renders behind the wallet modal

`apps/web/src/services/private-key-module/PkModulePopup.tsx:28` · security · **CONFIRMED** · risk: **high**

Lost `sx={{ zIndex: 1451 }}`; now inherits `z-[var(--z-overlay)]` (1400), below web3-onboard's
`--onboard-modal-z-index: 1450` and its opaque backdrop — which is still on screen while the key is
being requested.

**If we don't fix it:** on any chain where `pk` is not in `chain.disabledWallets` (mainnet included
in the committed snapshot), the private-key connect path is dead — the popup paints under onboard's
panel and scrim, and every click lands on onboard. Note the removed `sx` was the _only_ thing
enforcing the ordering, and `ModalDialog` now documents `sx` as ignored, so that escape hatch no
longer exists (see [Systemic themes](#systemic-themes)).

**Fix:** `className="z-[1451]"` on the `ModalDialog` (`cn` is twMerge, so it wins).

**Counter-argument:** reachability is config-gated per chain, and this is a developer-oriented signer.

### 7. Safe Apps queue bar buried by its own backdrop

`apps/web/src/components/safe-apps/AppFrame/TransactionQueueBar/index.tsx:78` · correctness · **CONFIRMED** · risk: **high**

Backdrop given `z-[var(--z-overlay)]` (1400), above the bar's own `z-index: 1200`.

**If we don't fix it:** deterministic CSS paint order, 100% reproducible. A user inside a Safe App
with a queued transaction expands the queue bar: rows and "Batch execute" appear behind a half-dark
scrim that swallows every click and collapses the bar. The Safe-Apps execution path is unreachable.

**Fix:** `z-[1199]` on the scrim, restoring dev's order.

### 8. Failed simulation shown as "can execute"

`apps/web/src/components/transactions/QueuedTxSimulation/index.tsx:36` · security · **PLAUSIBLE** · risk: **high**

A Tenderly call-trace error (Safe emitted `ExecutionFailure` though the outer tx succeeded) now
renders as "Can execute (with warnings)" with an amber icon instead of "Simulation failed" / red —
contradicting `getSimulationOutcome` in the same file, which still classifies `isCallTraceError` as
not-success.

**If we don't fix it:** a signer expands a queued tx whose inner call reverts (failing ERC-20 on an
under-funded token, slippage/deadline revert swallowed by a router, module call into a paused
contract). The row says it can execute; they sign and execute; the Safe emits `ExecutionFailure` and
the gas is spent for nothing.

**Counter-argument (why PLAUSIBLE):** the refuter argued the new wording may be _more_ accurate and
that for a modern Safe tx (`safeTxGas = 0`) a failing inner call usually reverts the whole
`execTransaction`, making `isCallTraceError` rare. Unresolved. The display/outcome disagreement
within one file is real regardless.

### 9. Full addresses truncate at 600–767px

`apps/web/src/components/common/EthHashInfo/SrcEthHashInfo/index.tsx:61` · regression · **CONFIRMED** · risk: **medium**

`useMediaQuery(theme.breakpoints.down('sm'))` (599.95px) → `useIsMobile()` (767px). The ~60 call
sites that deliberately pass `shortAddress={false}` now truncate to `0x1234…5678` in that band.

**If we don't fix it:** sharpest case — `SimilarityConfirmDialog` tells the user "This could be a
sign of an address poisoning attack — please verify this is the address you intend" and then shows a
_truncated_ address, defeating the check it is asking for. Also `tx/SendToBlock:23`, the recipient
row on every send review/confirm screen.

**Fix:** add `SM_DOWN_QUERY = '(max-width:599.95px)'` / `useIsBelowSm()` to `hooks/useMediaQuery.ts`
and use it here.

### 10. Safe selector: clicking the name does nothing

`apps/web/src/features/spaces/components/SafeSelectorDropdown/index.tsx:171` · correctness · **CONFIRMED** · risk: **medium**

`SelectTrigger` is `absolute inset-0 z-0` — a _sibling_ of, not an ancestor of, the display layer at
`relative z-10 … pointer-events-none [&_[data-slot=tooltip-trigger]]:pointer-events-auto`. The Safe
name is itself a tooltip trigger, so it re-enables pointer events and swallows the click.

**If we don't fix it:** clicking the Safe name to switch Safes does nothing; clicking the avatar or
chevron a few pixels away works. A primary navigation control that responds only on some pixels
reads as a frozen app.

**Fix:** delegate the click on the display layer rather than relying on click-through.

**Counter-argument:** the dead zone is partial — avatar, gaps, address line, badge, balance and
chevron all still work. It is intermittent, not total.

### 11. Dialogs go fullscreen below 768px (was 600px)

`apps/web/src/components/common/ModalDialog/index.tsx:99` · regression · **CONFIRMED** · risk: **medium**

One hook substitution retargets all 43 `ModalDialog` call sites across 39 files: Receive-assets QR,
Captcha, all four address-book dialogs, remove-Safe, ~38 more.

**If we don't fix it:** tablet-portrait users and anyone at browser zoom get the phone layout. No
funds at risk — but it is unreviewed presentation drift across every dialog in the product, and the
branch hand-writes exact `max-[599px]` queries elsewhere, so 600px fidelity was clearly intended
in some places and lost here.

### 12. Nine icon-only buttons lost their accessible names

`apps/web/src/components/transactions/TxSigners/index.tsx:68` · a11y · **CONFIRMED** · risk: **medium**

MUI v6 `Tooltip` injected `aria-label` onto its child when `title` was a string
(`Tooltip.js:544`, `describeChild = false` by default). Base UI's tooltip wires **no** ARIA at all —
confirmed against `@base-ui/react@1.2.0`: no `useRole`, and the only role in the module is
`presentation` on the positioner. The SVGs carry no `<title>` and `Button` injects no label.

**If we don't fix it:** `copy-tx-hash-btn` (was "Copy transaction hash") and the icon buttons in
`tx/AdvancedParams/GasLimitInput.tsx:47` announce as bare "button". A screen-reader user verifying a
transaction hash before signing gets no indication of what the control does.

**Fix:** `aria-label` on the affected triggers. This was reported by the finder as a _primitive_
defect and refuted at that level — the call-site name loss is what survives.

### 13. `info` / `warning` `-strong` tokens fail AA contrast

`apps/web/src/styles/shadcn.css:155` · a11y · **CONFIRMED** (browser-measured) · risk: **medium**

The new `--color-*-strong` / `--color-*-subtle` pairs alias `*.dark` onto `*.background`, pairing
values never meant to go together: **info 2.04:1** in light mode, **warning 3.14:1** in dark — both
under the 4.5:1 AA text threshold.

**If we don't fix it:** light mode — the counterfactual "Activating account" pill renders #52bfdc
10px text on #effcff across the safe list, multi-chain groups and Spaces cards, effectively
illegible. Dark mode — 27 non-story `variant="warning"` sites resolve to `text-warning-strong`
(#c04c32), systematically de-emphasising the copy that tells a user _why_ a transaction is risky.

**Fix:** correct the token values in `shadcn.css` using the pattern the same file already applies to
`destructive` at lines 84-86. Do not touch the 27 call sites.

**Counter-argument:** for the named warning sites, dev used MUI `<Alert severity="warning">` whose
body text was `text.primary` (~16.8:1) — so the cited "dev was 6.62:1" baseline is wrong; the real
comparison is worse for the branch, not better. The `info` case's stated consequence ("user cannot
tell whether the Safe is activating") overstates it — the two states also differ by background tint.

### 14. Multichain group header is not keyboard-operable

`apps/web/src/features/myAccounts/components/AccountItems/MultiAccountItem.tsx:129` · a11y · **CONFIRMED** · risk: **medium**

`CollapsibleTrigger` renders as a `<div>` while Base UI's `nativeButton` stays at its `true` default,
so Base UI keeps the native-button path and emits no `role="button"` and no Enter/Space activation.
Rendered output: `<div type="button" tabindex="0" aria-expanded="false">` — no role, and neither key
toggles it.

**If we don't fix it:** keyboard and AT users can tab to the multi-chain group header on the accounts
list — the primary Safe-selection screen — but cannot expand it, so every Safe inside a multi-chain
group is unreachable without a mouse. This worked on dev via MUI `ButtonBase`.

**Fix:** `nativeButton={false}`. One prop.

---

## P2 — follow-up

### 15. 160 Tailwind class assertions in place of behavioural tests

`apps/web/src/components/tx/confirmation-views/BatchTransactions/BatchTransactions.test.tsx:52` · test-coverage · **PLAUSIBLE** · risk: **medium**

The branch adds ~160 `toHaveClass()` assertions on utility strings (`h-10`, `px-6`,
`bg-success-subtle`, `h-[66px]`, `min-w-[7rem]`) while removing the theme provider from
`test-utils.tsx` / `scenario-utils.tsx` and stubbing `matchMedia` so **every width query returns
false**.

**Why it matters:** jsdom computes no Tailwind CSS, so a class assertion passes whether or not the
class is ever emitted or has any visual effect — it cannot fail for the right reason, and it must be
rewritten on every design-system change (this branch's own ongoing work), which makes the "fix" a
paste of the new class string. Combined with the always-false `matchMedia`, the entire responsive
surface — including findings #9 and #11 above — is untested. The branch also adds Argos visual
regression in the same PR, which is the right layer for this.

Separately, real assertions were dropped on premises that do not hold: `BatchTransactions.test.tsx:52`
justifies deleting its only decoded-details assertion by claiming the accordion is frozen closed. It
expands fine in both the controlled and uncontrolled paths, and a 170-line snapshot was re-recorded
to bless it — so a regression in the panel where a user reviews what each batched transaction does
would now go unnoticed. Same shape at `CookieAndTermBanner/__tests__/index.test.tsx:32` and
`tests/pages/apps.test.tsx:834`.

---

## Systemic themes

Three findings above are symptoms of issues better decided once than patched fifteen times.

**Breakpoints have no single source of truth.** Tailwind's defaults (sm 640 / md 768 / lg 1024) do
not match MUI's (sm 600 / md 900 / lg 1200), and there is no `screens` or `--breakpoint-*` override
anywhere. The branch mixes 131 `sm:` / 132 `md:` / 43 `lg:` usages against 11 hand-written
`min-[900px]`-style queries, plus **three different "mobile" thresholds**: `use-mobile.ts` at 768,
`useIsBelowMd` at 899.95, Tailwind `sm:` at 640. Findings #9 and #11 both fall out of this.

**`sx` is a prop surface that lies.** `ModalDialog` declares `sx?: object` and never reads it;
`TxCard` does `void sx`. Because the type is `object`, neither `tsc` nor the 161 lines of new
design-system ESLint guards will ever flag a call site. Eight production call sites still pass it —
including three passing `zIndex` _with comments explaining a layering requirement the code no longer
enforces_ (`SafeListContextMenu:184`, `SpaceSafeBar:321`, `SafeAccountsTable:354`) and two passing
card-seam geometry. Finding #6 is the case where this already broke.

**The overlay stack collapsed to one layer.** dialog, popover, dropdown-menu, select, tooltip and
sheet all use `z-[var(--z-overlay)]` (1400), so ordering between them is decided by portal DOM order
alone. `drawer.tsx` uses a bare `z-50` — below `--z-sidebar` (1300). The newly added `--z-picker: 1500`
is referenced nowhere. And `--onboard-modal-z-index: 1450` sits above the whole app layer.
Findings #6 and #7 are both instances.

---

## Refuted, with the counter-argument that killed them

1. **`SideDrawer` inlined tablet query diverges from `useIsTablet()`** — real, but the disagreement
   is confined to the 899.0–899.95px sliver, and the same bound already existed on dev. Cosmetic.
2. **`ModalDialog` silently discards `sx`/`slotProps`** — mechanism fully confirmed and _not_
   knocked down, but the three z-index intents currently work by accident via portal DOM order.
   Downgraded to cleanup debt rather than a live bug — captured under Systemic themes instead.
   It becomes live if anyone re-parents `EntryDialog` or adds `keepMounted`.
3. **`TooltipContent` has no `role="tooltip"`** — refuted at the primitive level (Base UI's own
   pattern), but the _consumer-level_ accessible-name loss is real and survives as finding #12.

Also refuted during my own inline pass, before the fan-out: `common/Chip`'s `sx` shim is correct;
`EnhancedTable`'s hand-rolled pagination correctly resets `page` and handles both edge cases; there
is no dynamic Tailwind class-name construction; `_document.tsx`'s reduction to 1 line is a clean
Emotion removal keeping `lang="en"`; `HighlightedAddress` and `SimilarityWarning` are faithful ports;
the dark `--destructive` change is safe because no variant uses it as a solid background; the
`TxLayout` → `TxLayoutBase` merge is faithful; and `disabled`-prop density across the tx surfaces
went _up_, not down.

## Unverified tail

45 lower-severity candidates were dropped before verification. The ones I would triage first:

- `TokenAmountInput/index.tsx:163` — token selector lost its `register(…, { required: true })` when
  the MUI select became a controlled shadcn `Select`, so the field is no longer required. **Correctness.**
- `hooks/useMediaQuery.ts:12` — initialises `matches` to `false` and only reads `matchMedia` in an
  effect, where MUI read it synchronously during render. Transient wrong `deviceType` in
  `useGtm`/`useMixpanel` and a desktop→mobile layout snap. _This is the one finding no surviving
  agent independently challenged._
- `common/ModalDialog/styles.module.css:16` and `TxModalDialog/styles.module.css:19` — dialog footers
  and tx-modal scroll containment still target `:global .MuiDialogActions-root` /
  `.MuiDialog-container`, which can never match now. Dead CSS, unstyled footers.
- `common/Popup/index.tsx:17` — reimplemented on Base UI `Popover`, whose `modal` default is `false`,
  dropping the focus trap, scroll lock and click-blocking backdrop MUI's `Popover` provided.
- `eslint.config.mjs:226` — a new guard's error message tells developers to use `SelectTrigger` props
  this same diff deleted. `:22` — all six guards anchor on `(?:^|\s)`, so any variant-prefixed
  utility bypasses them.
- `.github/workflows/web-argos-storybook.yml:94` — declares `dev` as the Argos baseline, but no
  trigger ever produces a build on `dev`, so it can never diff.
- `config/chains.bootstrap.json:1` — new file containing only `[]`, zero importers.
- `AccountItem/AccountItemLink.tsx:52` — every Safe row link now has the identical accessible name
  "Open Safe"; `SafeAccountTableRow.tsx:384` — cmd/middle-click over the identity cell no longer
  opens the Safe.
