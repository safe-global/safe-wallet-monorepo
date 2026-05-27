# Mobile WalletConnect dApps — POC design

POC scope on top of the full feature designed in [2026-05-11-mobile-walletconnect-dapps-design.md](./2026-05-11-mobile-walletconnect-dapps-design.md) and ticketed in [2026-05-12-mobile-walletconnect-dapps-tickets.md](./2026-05-12-mobile-walletconnect-dapps-tickets.md).

- **Status:** draft, awaiting review
- **Date:** 2026-05-21
- **Goal:** ship a testable end-to-end wallet-side WalletConnect implementation behind real dApps (Uniswap on desktop, mobile dApps via deep link) with the minimum surface area needed to demonstrate pairing + transaction execution. Not pixel-perfect. No automated tests. Polish, E2E, and the "My Code" tab are deferred.

## 1. Delivery shape

Two PRs against `dev`, both branched off `dev`. Sequenced:

1. **Prerequisite:** `danield/mobile-tx-preview` (the Send-flow refactor introducing `draftTxSlice` / `synthesizeDraftTxDetails` / `prebuiltSafeTx`) lands on `dev`. PR 2 consumes that infrastructure, so it must be on `dev` before PR 2 starts.
2. **PR 1 — Signer refactor.** Branches off `dev`. Mechanical move + import-path churn. Merges to `dev`.
3. **PR 2 — Wallet-side POC.** Branches off `dev` after PR 1 lands.

### PR 1 — Signer refactor (Ticket 1 verbatim)

Move `apps/mobile/src/features/WalletConnect/{appKit.ts,components,context,hooks,utils}` into `Signer/`. Extract `shared/{compat,projectId,metadata,mmkvStorageAdapter}.ts`. Update every importer. No behavior change. Manual smoke test of existing Signer flows on iOS + Android before merging.

Why split: PR 2 needs `shared/` to exist. Doing the refactor on its own PR keeps the import-path churn out of the feature diff, makes the refactor easy to revert if it breaks the Signer, and lets PR 2's review focus on actual product work.

### PR 2 — Wallet-side POC

Single PR. Adds `apps/mobile/src/features/WalletConnect/Wallet/`. Implements pairing, session management, request handling, and the RPC method router end-to-end. Reviewed as one piece because the parts are tightly coupled and demoing the POC requires all of them.

## 2. PR 2 scope

### In

- **Infrastructure (Ticket 2, full).** `getWalletKit()` singleton on `walletkit` MMKV id; `WalletKitProvider` mounted in `_layout.tsx` next to `WalletConnectContext`; `walletKitSlice` (sessions + pendingRequests, derived state, not redux-persist); `RequestSheetHost` modal-strict mount reading `selectCurrentRequest`; subscriptions to `session_proposal`, `session_request`, `session_delete`, `session_expire`, `session_update`, `session_authenticate`; seed from `getActiveSessions()` and `getPendingSessionRequests()` on init; `wc://` Android intent filter + iOS URL scheme + `Linking` listener calling `pair({uri})`; active-Safe binding calling `updateSession` + emitting `chainChanged`/`accountsChanged` per session; mount outside the AppKit `FullWindowOverlay` on iOS.
- **Session proposal flow (Ticket 3, simplified UI).** `SessionProposalSheet` with dApp logo (placeholder fallback), name, URL pill, verify badge, Connect CTA; dismissal calls `rejectSession(USER_REJECTED)`. `ConnectionPermissionsPanel` rendering the three banner variants (verified / unverified / malicious) with static permission bullets. `services/namespaces.ts` wrapping `buildApprovedNamespaces` with EIP-55 checksummed accounts. Auto-reject for non-eip155 required namespace, unsupported chains, or null active Safe. Verify status warn-not-block. Success → top toast + session added; failure → error toast. Uses existing Tamagui components without bespoke styling — pixel-perfect Figma matching is deferred.
- **Scanner entry + deep link (Ticket 4, simplified).** Header QR button (40×40, hidden when no active Safe). `QrScannerSheet` reusing `QrCamera` with a `wc:` validator, "Connecting…" spinner on valid scan, 10s timeout, inline error overlay with Try again. No segmented control (single tab) — "My Code" is deferred. Deep links go through the same `pair({uri})` path; the proposal sheet handles both.
- **Connected dApps management (Ticket 6, simplified).** Settings entry below Signers, conditionally rendered when `≥1` session exists. List screen with rows (dApp icon + name + URL). Single tap on row → plain confirm modal → disconnect. No swipe-to-delete. No 3-dots menu. dApp-initiated `session_delete` updates list silently. Success toast on user-initiated disconnect only.
- **Transaction requests (Ticket 7, full).** Router wires `eth_sendTransaction` and `wallet_sendCalls`. New `services/composeSafeTxDraft.ts` modelled on `prepareSendDraft.ts` — builds SafeTransaction from dApp-supplied `{to, value, data}` (or batch), calls CGW `/preview`, synthesizes a `TransactionDetails` via the existing `synthesizeDraftTxDetails` utility, stashes in `draftTxSlice` keyed by `safeTxHash`. `SendTransactionSheet` with dApp identity, chain badge, decoded payload (or batch list), Reject/Sign. Sign routes through the existing review-and-confirm tail (`apps/mobile/src/app/review-and-confirm.tsx`), which already short-circuits to drafts via `useTransactionData`. Response to dApp: `safeTxHash` on `eth_sendTransaction`, `{ id: safeTxHash }` on `wallet_sendCalls`, delivered at signer-completion time. Draft cleared on reject / signing error.
- **Read-only Safe gating (basic).** Category-A tx requests on a Safe without a signer attached → auto-reject with `formatJsonRpcError(id, { code: 4100, message: 'No signer attached to this Safe' })` + generic toast. No "Add a signer" CTA on the toast — deferred to the full feature.
- **RPC method router (Ticket 8, full).** Read-only proxy via ethers v6 `JsonRpcProvider` for the chain in `params.chainId`; allow-list as specified. `eth_accounts`/`eth_chainId`/`net_version` answered locally. `wallet_switchEthereumChain` → dispatch `switchActiveChain` + `updateSession`, respond `null`; non-deployed chain → `4901`. `wallet_getCapabilities` → `{atomicBatch: {supported: true}}` per approved chain. `wallet_getCallsStatus` → local Safe-tx status lookup. `wallet_showCallsStatus` → navigate to queue/tx-detail screen. Signing methods + `safe_setSettings` → `UNSUPPORTED_METHOD` without UI. `session_authenticate` event → `rejectSessionAuthenticate(UNSUPPORTED_METHOD)`. Unknown method → `UNSUPPORTED_METHOD`; cross-namespace method → `UNAUTHORIZED_METHOD`.

### Out

- **Ticket 5 — "My Code" tab.** Scanner sheet is single-tab in the POC. Receive surface stays on its own route.
- **Tickets 9–11 — Maestro E2E.** No new flows, no debug-mode event-synthesis hook on `WalletKitProvider`.
- **All Jest unit + integration tests** for the new code. PR 2 ships with no new test files. Existing tests must still pass.
- **Figma pixel-perfect polish.** Banners, badges, sheet shells, toasts use the existing Tamagui design tokens at their default styling. No new design tokens added. Visual deltas vs. Figma are accepted; tracked as follow-up work.
- **Telemetry.** No new event logging beyond `console.log` for ad-hoc debugging.
- **"Add a signer" CTA** on the read-only Safe rejection toast — deferred.
- **Swipe-left disconnect + 3-dots context menu** on the Connected dApps list — deferred.
- **`wcAutoApprove` / trusted-dApps memory** — out per the design doc.

## 3. Folder layout

```
apps/mobile/src/features/WalletConnect/
├── Signer/                  # populated by PR 1
├── shared/                  # populated by PR 1
└── Wallet/                  # new in PR 2
    ├── walletKit.ts                          # getWalletKit() singleton
    ├── context/
    │   └── WalletKitProvider.tsx             # mounts WalletKit + subscribes + mounts RequestSheetHost
    ├── store/
    │   └── walletKitSlice.ts                 # sessions, pendingRequests, selectors
    ├── hooks/
    │   ├── useSessionProposalHandler.ts
    │   ├── useSessionRequestHandler.ts
    │   ├── useSessionDeleteHandler.ts
    │   └── useActiveSafeBinding.ts
    ├── services/
    │   ├── constants.ts                      # WALLET_SUPPORTED_METHODS, read-only allow-list
    │   ├── namespaces.ts                     # buildApprovedNamespaces wrapper
    │   ├── methodRouter.ts                   # dispatches session_request by method
    │   ├── readRpcProxy.ts                   # ethers v6 JsonRpcProvider proxy for allow-list
    │   └── composeSafeTxDraft.ts             # SafeTransaction → /preview → synthesize → draftTxSlice
    ├── components/
    │   ├── HeaderQrButton.tsx
    │   ├── QrScannerSheet.tsx                # single tab
    │   ├── SessionProposalSheet.tsx
    │   ├── ConnectionPermissionsPanel.tsx
    │   ├── RequestSheetHost.tsx              # mounted by provider, modal-strict bottom sheet
    │   ├── SendTransactionSheet.tsx
    │   ├── ConnectedDappsEntry.tsx           # settings row, conditional on sessions.length > 0
    │   └── ConnectedDappsScreen.tsx          # list + tap-to-disconnect + confirm modal
    └── utils/
        └── verifyStatus.ts                   # VALID/UNKNOWN/INVALID/isScam → 'verified'|'unverified'|'malicious'
```

## 4. Dependencies & risks

### Dependencies to verify before starting PR 2

- **`danield/mobile-tx-preview` merged to `dev`.** PR 2 branches off `dev` and consumes `draftTxSlice`, `synthesizeDraftTxDetails`, and the `prebuiltSafeTx` signer param introduced by that branch. Confirm the merge has happened before PR 2 starts; do not stack PR 2 on the feature branch.
- **PR 1 (Signer refactor) merged to `dev`.** PR 2 imports from `shared/{compat,projectId,metadata,mmkvStorageAdapter}.ts` introduced by PR 1.
- **`@reown/walletkit` + `@walletconnect/core`.** New dependencies on `apps/mobile/package.json`. Pin to versions compatible with the existing AppKit dep (`@reown/appkit-ethers-react-native`) where possible.
- **`react-native-vision-camera` + `QrCamera`.** Already in place; used by Signer's WC URI scanner.

### Known risks to spike during PR 2

- **Android `wc://` intent filter collision with AppKit.** Both SDKs may try to claim the scheme. Reown's routing between roles needs to be verified, otherwise a `pair()` from one SDK could race with the other. Spike before wiring deep links; if the SDKs collide, fall back to scanner-only for the POC and file a follow-up.
- **`getPendingSessionRequests()` API surface.** Pin to the installed WalletKit version; verify the shape matches the design doc's assumption that it returns an array of `SessionRequest`.
- **iOS `FullWindowOverlay` coexistence.** WalletKit sheets must mount outside the AppKit overlay. The design calls this out; verify visually that proposal/tx sheets render correctly while a Signer modal is open and vice versa.

## 5. Acceptance for the POC

A reviewer should be able to:

1. **Pair via QR** — scan a Uniswap (desktop) `wc:` QR from the header button; proposal sheet opens; Connect; success toast; the Uniswap UI shows the wallet as connected.
2. **Pair via deep link** — open a `wc://` URL on the device (e.g. from a mobile dApp or a debug URL); the app foregrounds and the proposal sheet opens directly with no scanner.
3. **Reject a session** — swipe down on the proposal sheet; the dApp sees the rejection.
4. **Send a tx** — initiate a swap on Uniswap; `SendTransactionSheet` opens with the decoded payload; Sign; the Safe tx appears in the local queue; Uniswap receives `safeTxHash` immediately (before mining).
5. **Switch chain from dApp** — `wallet_switchEthereumChain` for a chain the Safe is deployed on flips the active chain locally; non-deployed chain returns `4901`.
6. **Read-only call from dApp** — `eth_call` proxied to the chain RPC returns the expected result.
7. **Read-only Safe rejection** — open the same swap with no signer attached; auto-reject toast appears; dApp gets `4100`.
8. **Sign request rejection** — a dApp that calls `personal_sign` sees `UNSUPPORTED_METHOD` without any UI being opened in the app.
9. **Disconnect from settings** — open Connected apps from settings; tap a row; confirm; the dApp loses the session.
10. **dApp-initiated disconnect** — disconnect from Uniswap's UI; the row disappears from the list silently (no toast).

No automated test coverage is required for the POC. Reviewers verify manually using the steps above.

## 6. What this POC is NOT

- Not a feature merge. The full feature will land via the 11 tickets after the POC validates the design end-to-end.
- Not a refactor target for the existing AppKit / Signer code beyond what PR 1 already covers.
- Not a UI deliverable. Designers will review the POC for product correctness only; visual sign-off happens during the full-feature implementation.

## 7. Open items to resolve at start of PR 2

- WalletKit version pin (depends on what's currently latest and compatible with AppKit's deps).
- Confirm `danield/mobile-tx-preview` and PR 1 are both on `dev` before branching PR 2 off `dev`.
