# Mobile WalletConnect dApps — Linear ticket draft

Draft of eleven Linear tickets to implement the [mobile WalletConnect dApps design](https://github.com/safe-global/safe-wallet-monorepo/blob/dev/docs/superpowers/specs/2026-05-11-mobile-walletconnect-dapps-design.md). Each ticket uses the Wallet team's **Feature Spec Template** (`## Problem`, `## Solution`, `## Acceptance criteria`) and is intended to be attached to the **WalletConnect dApps** project (Linear: `safe-global/walletconnect-dapps`, ID `7445b7d3-4daf-4208-997c-e8e9fea82f5c`, team `WA`).

Tickets 1–8 cover implementation; tickets 9–11 cover Maestro E2E coverage of the user-facing flows.

Tickets are ordered by dependency. Ticket 1 must merge before 2–11 can start; 2 unblocks 3–11; 3–8 are mostly parallelisable apart from where noted under each ticket. E2E tickets 9–11 each depend on their corresponding implementation ticket(s).

**Out of scope for this feature:** off-chain message signing (`personal_sign`, `eth_sign`, `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4`) and the SIWE / 1-Click Auth flow (`session_authenticate`), which depends on it. These methods are reported to dApps as `UNSUPPORTED_METHOD`, and `session_authenticate` is rejected outright. Tracked separately if and when off-chain signing infrastructure lands on mobile.

**Labels for all tickets:** `Mobile`, `Task`.

---

## Ticket 1 — Refactor: move existing WalletConnect code into `Signer/` and extract `shared/`

### Problem

The existing AppKit-based WalletConnect implementation (signer side) lives at the root of `apps/mobile/src/features/WalletConnect/`. To make room for the new wallet-side feature (dApps connecting to Safe) without confusing the two roles, the existing code needs to move into a `Signer/` subtree. Several pieces of scaffolding inside `appKit.ts` (project ID, metadata, MMKV storage adapter, `@walletconnect/react-native-compat` polyfill) will also be needed by the new wallet-side code; today they're inlined and not reusable.

### Solution

Move every file currently under `apps/mobile/src/features/WalletConnect/` into a new `Signer/` subtree, and extract the shared scaffolding into a `shared/` subtree consumed by both Signer and the upcoming Wallet code.

Target layout:

```
apps/mobile/src/features/WalletConnect/
├── Signer/
│   ├── appKit.ts            # was: features/WalletConnect/appKit.ts
│   ├── components/          # was: features/WalletConnect/components/
│   ├── context/             # was: features/WalletConnect/context/
│   ├── hooks/               # was: features/WalletConnect/hooks/
│   └── utils/               # was: features/WalletConnect/utils/
└── shared/
    ├── compat.ts            # '@walletconnect/react-native-compat' side-effect import
    ├── projectId.ts         # process.env.EXPO_PUBLIC_REOWN_PROJECT_ID
    ├── metadata.ts          # SAFE_WALLET_METADATA constant
    └── mmkvStorageAdapter.ts # createMmkvStorage(id) factory returning a WC Storage adapter
```

`Signer/appKit.ts` consumes `shared/projectId.ts`, `shared/metadata.ts`, and `createMmkvStorage('appkit')` — its inlined versions are removed. The `@walletconnect/react-native-compat` import moves from `appKit.ts` to `shared/compat.ts`, which is imported once from `_layout.tsx`.

All importers across `apps/mobile/src` are updated. Existing tests stay green without behaviour changes.

### Acceptance criteria

- All files previously at `features/WalletConnect/{appKit.ts,components,context,hooks,utils}` now live under `features/WalletConnect/Signer/`.
- `features/WalletConnect/shared/` exists with `compat.ts`, `projectId.ts`, `metadata.ts`, `mmkvStorageAdapter.ts`.
- `Signer/appKit.ts` imports its metadata, projectId, and MMKV storage adapter from `shared/`; no duplicated constants remain.
- `@walletconnect/react-native-compat` is imported exactly once across the codebase, from `shared/compat.ts`.
- Existing Signer unit/integration tests pass without modification beyond import-path updates.
- `yarn workspace @safe-global/mobile type-check`, `lint`, and `test` all pass.
- Manual smoke test: existing Signer connect, sign, and execute flows work end-to-end against a real external wallet on iOS + Android.

**Designs:** n/a — refactor with no UI changes.

---

## Ticket 2 — Infrastructure: WalletKit singleton, provider, store slice, deep-link routing

### Problem

The new dApp-connection feature needs a long-lived `@reown/walletkit` instance, a React provider wiring it into the app, a Redux slice mirroring active sessions for UI consumption, a root-level mount point for incoming-request sheets, and deep-link handling for `wc:` URIs arriving via `Linking` (Part 3 of the design). None of this exists today.

### Solution

Build the wallet-side infrastructure under `apps/mobile/src/features/WalletConnect/Wallet/`:

- `Wallet/walletKit.ts` — async `getWalletKit()` singleton creating `Core` + `WalletKit.init({core, metadata})`. Storage from `shared/mmkvStorageAdapter.ts` with id `walletkit`; `projectId` and `metadata` from `shared/`.
- `Wallet/context/WalletKitProvider.tsx` — mounts at the same level as the existing `WalletConnectContext` in `_layout.tsx`. On mount: instantiates WalletKit, seeds the slice from `getActiveSessions()`, seeds pending requests from `getPendingSessionRequests()`, subscribes to `session_proposal`, `session_request`, `session_delete`, `session_expire`, `session_update`, `session_authenticate`.
- `Wallet/store/walletKitSlice.ts` — derived-state slice (not persisted via redux-persist). Holds `sessions: Record<topic, SessionMeta>` and `pendingRequests: SessionRequest[]` (FIFO). Reducers: `sessionAdded`, `sessionRemoved`, `sessionUpdated`, `requestEnqueued`, `requestDequeued`. Selectors include `selectCurrentRequest`.
- `Wallet/components/RequestSheetHost.tsx` — modal-strict bottom sheet (`enablePanDownToClose={false}`, no backdrop dismiss) mounted by the provider. Reads `selectCurrentRequest`; routes to the correct request-type sheet (left empty in this ticket; populated by tickets 5–7). When the current request resolves, pulls the head of `pendingRequests` next.
- Deep-link handling: `app.config.ts` adds an intent filter for `wc://`; `Linking` listener in the provider calls `walletKit.pair({uri})` when a matching URL arrives.
- Active-Safe binding: on `selectActiveSafe` change, call `walletKit.updateSession({topic, namespaces})` for every active session and emit `chainChanged`/`accountsChanged`.
- iOS coexistence: the WalletKit sheets/host mount **outside** the existing AppKit `FullWindowOverlay`.

No actual UI for proposals/requests in this ticket — only the host shell and the plumbing. Subscribed handlers can be stubs that log; tickets 3–7 wire them up.

### Acceptance criteria

- `getWalletKit()` produces a singleton WalletKit instance bound to MMKV id `walletkit`.
- `WalletKitProvider` is mounted in `apps/mobile/src/app/_layout.tsx` and subscribes to all six events listed above.
- `walletKitSlice` is registered in the store, with reducers covered by unit tests.
- On launch, the slice is correctly seeded from `getActiveSessions()` and `getPendingSessionRequests()`.
- Active-Safe change calls `updateSession` and emits events for every active session (covered by a hook-level unit test).
- A `wc://` deep link launched while the app is foregrounded calls `walletKit.pair({uri})` (covered by an integration test with `Linking` mocked).
- `RequestSheetHost` is mounted at the root level, renders nothing when `pendingRequests` is empty, and is modal-strict.
- No regression to the existing Signer flow.

**Designs:** n/a — plumbing only, no UI surfaces in this ticket.

**Depends on:** Ticket 1.

---

## Ticket 3 — Session proposal sheet, namespace construction, connect/reject

### Problem

When a `session_proposal` event fires (regardless of whether it came from a QR scan or a `wc://` deep link), the user needs to see a "Connection request" bottom sheet showing the dApp identity and verify status, optionally expand a permissions explainer, and approve or reject the session. This is the core pairing UX and can be developed and tested independently of the QR scanner — the proposal event can be driven by deep link or a test fixture.

### Solution

Add the session proposal flow under `apps/mobile/src/features/WalletConnect/Wallet/`:

- **`Wallet/components/SessionProposalSheet.tsx`** — main state per [Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16041-2924). 48×48 dApp logo (from `params.proposer.metadata.icons[0]`, falling back to a generic placeholder on missing/failed load) + verify-status badge; dApp name; URL pill with info icon; primary CTA **Connect**. Dismissal (swipe down or backdrop) calls `rejectSession({id, reason: USER_REJECTED})`.
- **`Wallet/components/ConnectionPermissionsPanel.tsx`** — details panel opened from the URL info icon per [Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16041-3229) (and the [unverified variant](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-5236)). Single prop `verifyStatus: 'verified' | 'unverified' | 'malicious'`. Static permissions bullets ("View your balance and activity", "Request transactions approval", "Move funds without permission"). Verify banner copy/colour switches per state; "Only continue if you trust the source." line shown for `unverified` and `malicious`. CTA "Got it" closes only the panel.
- **`Wallet/services/namespaces.ts`** — wraps `buildApprovedNamespaces` from `@walletconnect/utils`. Chains = intersection of dApp-required+optional eip155 with `state.safes[activeAddress]`. Accounts = `eip155:<chainId>:<safeAddress>` (EIP-55 checksum). Methods = `WALLET_SUPPORTED_METHODS` constant (mirrors web's `constants.ts`). Events = `['chainChanged', 'accountsChanged']`.
- **Auto-reject logic** wired in the `session_proposal` handler: non-eip155 required namespace → `UNSUPPORTED_NAMESPACE_KEY`; required chain not deployed → `UNSUPPORTED_CHAINS`; null active Safe → silent.
- **Verify-status policy:** warn-not-block, even for `isScam` (mirrors web).
- **Outcome:** success → [top toast](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16002-3870), session added to `walletKitSlice`, deep-link redirect back to dApp (WalletKit auto). Failure → [error toast](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16005-1400).

### Acceptance criteria

- `SessionProposalSheet` opens when a `session_proposal` event reaches the provider (driven by either deep link or test fixture).
- Sheet displays dApp logo (with placeholder fallback), name, URL, verify badge.
- URL info icon opens `ConnectionPermissionsPanel`; banner and bottom warning line render correctly for `VALID`, `UNKNOWN`, `INVALID`, `isScam`.
- Connect calls `walletKit.approveSession` with namespaces from `services/namespaces.ts`. Computed namespaces verified by snapshot in a unit test.
- Dismissal calls `rejectSession(USER_REJECTED)`.
- Auto-reject paths return the right SDK errors and surface the error toast.
- Success surfaces the top toast and adds the session to the slice.
- Unit tests for `namespaces.ts`, `SessionProposalSheet`, `ConnectionPermissionsPanel`.
- Manual QA via deep link: trigger a `wc://` URL from a desktop dApp (Uniswap) using a paired mobile-test setup; verify the proposal sheet opens, Connect approves, the dApp sees the session.

**Designs:**

- [Connection request — main state](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16041-2924)
- [Connection request — details, verified](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16041-3229)
- [Connection request — details, unverified](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-5236)
- [Verify-status badge variants](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-5659)
- [Success toast](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16002-3870)
- [Error toast](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16005-1400)

**Depends on:** Ticket 2.

---

## Ticket 4 — Header QR button + QR scanner sheet

### Problem

The user needs an entry point in the header to scan a `wc:` QR code from a desktop dApp. Tapping the entry should open a sheet with a camera scanner that validates the URI, calls `walletKit.pair({uri})`, and surfaces errors when the code is unreadable, malformed, or the dApp doesn't respond.

### Solution

Add the header button and a scanner-only bottom sheet:

- **Header QR button** — 40×40, `background/skeleton`, 24×24 QR icon. Hidden when `selectActiveSafe` is null. Tapping opens the scanner sheet. Position: between the chain selector and pending-tx button in the home/account header (confirm against current navbar at wiring time).
- **`Wallet/components/QrScannerSheet.tsx`** — `@gorhom/bottom-sheet` modal containing the scanner. Reuses `apps/mobile/src/components/Camera/QrCamera.tsx` with a `validator` prop that recognises `wc:` and rejects anything else inline. On valid URI → call `walletKit.pair({uri})`, show inline spinner overlaying the camera with "Connecting…", wait for `session_proposal` (10s timeout via the provider's `pendingPair` ref).
- On `session_proposal` arrival → close the scanner sheet; the proposal sheet (Ticket 3) takes over via its own state.
- On parse failure, `pair()` throw, or 10s timeout → swap to [error overlay](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-6016) with Try again CTA (resets state, doesn't reopen the camera).
- Camera permission via the existing `react-native-vision-camera` flow used by the Signer feature.

The sheet has **no segmented control / no second tab** in this ticket — Ticket 5 will wrap it with a tabbed shell when the My Code tab lands.

### Acceptance criteria

- Header QR button is visible in the home/account header and hidden when no Safe is selected.
- Tapping the button opens `QrScannerSheet`.
- Scanning a valid `wc:` QR calls `walletKit.pair` and shows the "Connecting…" spinner.
- On `session_proposal` event → scanner sheet closes (proposal sheet opens via Ticket 3).
- Scanning an invalid code shows the inline error overlay with Try again.
- `pair()` failure or 10s timeout shows the error overlay.
- Camera permission denied is handled per the existing scanner's conventions.
- Unit tests for the validator and the scanner state machine (idle → connecting → error/proposal-arrived).
- Manual QA: scan a Uniswap desktop QR; verify pairing succeeds and Ticket 3's sheet opens.

**Designs:**

- [Header QR button placement](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16002-3553)
- [QR scanner view](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16002-3012)
- [Scanner error state](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-6016)

**Depends on:** Ticket 2. Best to land after Ticket 3 so the end-to-end UX has a UI for the resulting proposal, but the scanner itself ships independently.

---

## Ticket 5 — My Code tab (reuse Share/Receive component)

### Problem

The "My Code" tab inside the same sheet as the QR scanner surfaces the Safe address as a plain QR code, with a list of chains the Safe is deployed on, so a user can hand the QR to someone who wants to send funds to the Safe. The home screen already has an equivalent "Receive" surface — `apps/mobile/src/features/Share/` — that renders the address QR, copy/share controls, and the chain row via `ChainsDisplay`. Re-implementing this for the tab would duplicate working code; we should reuse it.

### Solution

Restructure the scanner sheet from Ticket 4 into a tabbed `ScanConnect` shell with a segmented control, and embed the existing Share component in the My Code tab:

- Rename the sheet to `ScanConnect`. Add a segmented control at the **bottom** of the view (matching Figma) toggling **Scan QR** ↔ **My Code**. The Scan QR tab keeps the scanner from Ticket 4.
- **My Code tab** mounts [`ShareContainer`](https://github.com/safe-global/safe-wallet-monorepo/blob/dev/apps/mobile/src/features/Share/Share.container.tsx) directly — the same container the `/share` route uses today.
  - `ShareContainer` already reads the active Safe and resolves available chains via `selectSafeChains` + `getChainsByIds`, and renders `ShareView` (QR via `react-native-qrcode-styled`, identicon, address, copy + share buttons, `ChainsDisplay` row).
  - If the tab needs to render at a different padding/inset than the `/share` screen wrapper, adjust the surrounding `<View>` only — do **not** fork `ShareView` or `ShareContainer`. The tab is responsible for layout; the component is responsible for content.
- If the [Figma frame](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16202-4931) demands a visual variant that the existing `ShareView` doesn't support (e.g., a different chain-row chrome), the change is made in `ShareView` itself behind a small prop, so both the `/share` route and the new tab benefit. No forking.

### Acceptance criteria

- Sheet shows a segmented control at the bottom with Scan QR and My Code tabs; Scan QR is the default tab.
- My Code tab mounts `ShareContainer` from `@/src/features/Share` — verified by an import-graph assertion in the test or a direct reference in the component.
- No new QR-rendering, address-copy, or chain-row logic added under `Wallet/`. Any visual deltas demanded by the Figma frame are pushed into `ShareView` and shared with the `/share` route.
- Switching between tabs preserves scanner state (camera doesn't re-request permission).
- `/share` route on the home screen continues to render identically (covered by the existing `ShareView.test.tsx`, which must still pass).
- Manual QA: open the sheet, switch to My Code, scan the QR with another wallet, verify the address is read correctly; then verify the home-screen Receive flow still works unchanged.

**Designs:**

- [My Code tab — QR + supported networks](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16202-4931)
- [Supported networks modal](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16203-5157)

**Depends on:** Ticket 4 (owns the sheet shell).

---

## Ticket 6 — Connected dApps management (Part 2)

### Problem

Once a user has connected one or more dApps, they need a place to see and manage those sessions: a list under account settings, the ability to disconnect any session, and confirmation + feedback when they do.

### Solution

Add the Connected dApps settings entry and screen.

UI surfaces:

- **Settings entry** below the Signers row ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-1774)). Conditionally rendered when `Object.keys(sessions).length > 0`. Right accessory: session count + chevron.
- **Connected dApps screen** ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-2155)) — standard route under Settings stack. Each row: dApp icon + verify badge, name, URL, 3-dots menu trigger.
- **3-dots context menu** ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-6150)) — single "Disconnect" action.
- **Swipe-left** on a row reveals a trash button ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-2929)) — same `disconnect(topic)` helper as the menu.
- **Disconnect confirm modal** ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16120-3638)) — "Disconnect [dApp]?" + Confirm/Cancel.
- **Disconnect success toast** ([Figma](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16066-7568)) — shown only for **user-initiated** disconnect. `session_delete` arriving from the dApp side updates the list silently.

### Acceptance criteria

- "Connected apps" entry appears below "Signers" only when ≥1 session exists.
- Tapping the entry opens the list screen; rows render dApp icon (with fallback), name, URL, 3-dots.
- 3-dots menu → Disconnect → confirm modal → confirm → session removed → toast shown.
- Swipe-left → trash → confirm modal (same component) → same outcome.
- dApp-initiated disconnect updates the list without showing a toast.
- Disconnect calls `walletKit.disconnectSession({topic, reason: getSdkError('USER_DISCONNECTED')})`.
- Unit tests for the screen (empty/populated states), the row swipe + menu, and the disconnect helper.
- Manual QA: disconnect a real session from the mobile side and confirm the dApp's UI updates correctly.

**Designs:**

- ["Connected apps" entry in account settings](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-1774)
- [Connected dApps list](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-2155)
- [Swipe-left trash button](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16024-2929)
- [3-dots context menu with Disconnect](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16204-6150)
- [Disconnect confirm modal](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16120-3638)
- [Disconnect success toast](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16066-7568)

**Depends on:** Ticket 2. Parallelisable with Tickets 3, 4, 5.

---

## Ticket 7 — Transaction requests: eth_sendTransaction, wallet_sendCalls

### Problem

Connected dApps send `eth_sendTransaction` (and EIP-5792 `wallet_sendCalls`) requests to execute on-chain operations through the Safe. Mobile today only supports a token-send flow as a transaction author; there's no path to compose a Safe transaction from arbitrary `{to, value, data}`. We need this composer + the request sheets, with the request acknowledged to the dApp as soon as the user signs (returning `safeTxHash`, matching web).

The Send-token flow has just been refactored ([PR #7856](https://github.com/safe-global/safe-wallet-monorepo/pull/7856)) to call CGW `/preview` during compose and only `/propose` at sign time, with the draft stashed in a new `draftTxSlice` keyed by `safeTxHash`. dApp transaction requests should follow the same pattern — no eager `/propose`, no phantom queue entries if the user backs out, and one round-trip for the signed propose.

### Solution

Add tx-request handling to the WalletKit method router, reusing the draft pipeline introduced by PR #7856:

- Router wires `eth_sendTransaction` and `wallet_sendCalls`.
- **New service `Wallet/services/composeSafeTxDraft.ts`** — modelled on `apps/mobile/src/features/Send/services/prepareSendDraft.ts`. Builds a `SafeTransaction` locally from the dApp-supplied `{to, value, data}` (or array for EIP-5792), calls CGW `/preview`, synthesizes a `TransactionDetails` via the existing `synthesizeDraftTxDetails` utility (#7856), stashes it in `draftTxSlice`, and returns the `safeTxHash`.
- **`Wallet/components/SendTransactionSheet.tsx`** — dApp identity, chain badge, decoded `{to, value, data}` rendering. For EIP-5792, renders the batch of N calls. Reject → `USER_REJECTED`, draft cleared. Sign → routes through the existing review-and-confirm tail at `apps/mobile/src/app/review-and-confirm.tsx`, which already short-circuits to drafts via `useTransactionData` (#7856).
- **Sign-time flow** reuses `useTransactionSigning.executeSign`'s draft branch from #7856 — passes `prebuiltSafeTx`, signs, calls `/propose` once with the signature inline, clears the draft on success. No new signer plumbing needed beyond what #7856 lands.
- **Response to dApp:** as soon as the signer completes (before the tx is mined), respond with `safeTxHash` (or `{ id: safeTxHash }` for EIP-5792).
- **Read-only Safe gating:** when the active Safe has no signer attached, the router auto-rejects the request with `formatJsonRpcError(id, { code: 4100, message: 'No signer attached to this Safe' })` and shows a toast with an "Add a signer" CTA routing to the existing Signer flow. The sheet is **not** opened, and no draft is created.
- **Draft cleanup:** `draftTxSlice`'s existing extraReducers cover safe-switch, chain-switch, propose-success, and tx-fetch. Add a small reducer that clears the draft when the corresponding `session_request` is responded to (reject path or signing error), so dismissed requests don't leave dangling drafts.

### Acceptance criteria

- `eth_sendTransaction` opens `SendTransactionSheet` with synthesized draft details from CGW `/preview`; no `/propose` call until sign time.
- Composing a dApp request and dismissing the sheet → no phantom entry in the Safe queue (parity with #7856 for Send flow).
- Tap Sign → signer runs → CGW `/propose` is called once with the signature inline → `safeTxHash` delivered to the dApp before the tx is mined.
- `wallet_sendCalls` renders multiple calls in a batch and produces a single `safeTxHash` returned as `{ id: safeTxHash }`.
- Read-only Safe: auto-rejected with `4100` + toast; no draft created.
- `/preview` failure on compose: surface error toast; dApp gets `-32603` with the CGW message; no draft created.
- `/propose` failure at sign time: inline error on the sheet; dApp gets `-32603`; draft retained so the user can retry signing.
- Switching active Safe or chain while a draft is open clears the draft via the existing extraReducers and dismisses the sheet.
- `composeSafeTxDraft.ts` unit-tested for both single-tx and batch shapes, mirroring `prepareSendDraft.test.ts`.
- Sheet component unit-tested.
- Manual QA: against Uniswap (token swap on a test chain) and at least one other dApp; verify the queued Safe tx surfaces in the existing queue and can be executed normally; verify backing out does not create a phantom queue entry; verify network panel shows exactly one `/preview` (compose) and one `/propose` (sign).

**Designs:**

- [Confirmed transaction view — dApp logo + name treatment](https://www.figma.com/design/yVshG47sZRM7ztI66bDII4/Mobile-App?node-id=5316-26402) — reference for how the dApp identity (logo + name) renders on a Safe tx originated via WalletConnect. The new `SendTransactionSheet` should mirror this header treatment.
- No dedicated Figma frame for the `SendTransactionSheet` review state was supplied in the [parent Figma file](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps) at the time of writing. Confirm with design before implementation; meanwhile follow the dApp-identity treatment from the [proposal sheet](https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps?node-id=16041-2924) and the existing mobile review/confirm screen conventions.

**Reference implementation:** [PR #7856](https://github.com/safe-global/safe-wallet-monorepo/pull/7856) — the Send-flow refactor that introduces `prepareSendDraft`, `synthesizeDraftTxDetails`, `draftTxSlice`, and the `prebuiltSafeTx` signer parameter we reuse here.

**Depends on:** Ticket 2; PR #7856 merged.

---

## Ticket 8 — Read-only RPC proxy + wallet-control methods

### Problem

The remaining methods in the wallet's RPC surface fall into two groups: read-only methods that should be proxied to a chain JSON-RPC, and wallet-control methods that mutate session-level state (chain switching, capability lookups). On top of these, the router also needs to return explicit `UNSUPPORTED_METHOD` responses for methods that this feature does not implement (off-chain signing, `safe_setSettings`), and to handle the `session_authenticate` event by rejecting it. Without this layer the wallet either responds incorrectly or hangs on common dApp calls.

### Solution

Wire the remaining categories into the method router:

- **Category B — read-only proxy** (`Wallet/services/readRpcProxy.ts`):
  - Allow-list: `eth_blockNumber`, `eth_getBalance`, `eth_getCode`, `eth_getTransactionCount`, `eth_getStorageAt`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_estimateGas`, `eth_call`, `eth_getLogs`, `eth_gasPrice`.
  - Builds an ethers v6 `JsonRpcProvider` for `params.chainId` using chain config from `packages/store/src/gateway/chains/`.
  - `eth_accounts`, `eth_chainId`, `net_version` answered locally (active Safe + chain).
- **Category C — wallet-control:**
  - `wallet_switchEthereumChain` — target in Safe's deployed chains → `switchActiveChain` + `walletKit.updateSession`, respond `null`. Otherwise respond `{code: 4901}`.
  - `wallet_getCapabilities` — `{atomicBatch: {supported: true}}` per approved chain.
  - `wallet_getCallsStatus` — local Safe-tx status lookup for the `safeTxHash` from an earlier `wallet_sendCalls`.
  - `wallet_showCallsStatus` — navigate to the queue/tx-detail screen.
- **Unsupported-by-feature**: `personal_sign`, `eth_sign`, `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4`, `safe_setSettings` all respond with `formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHOD'))`. The router does **not** open any UI for these.
- **`session_authenticate` event** is wired to call `walletKit.rejectSessionAuthenticate({ id, reason: getSdkError('UNSUPPORTED_METHOD') })`. We do not surface a UI for it.
- Unknown method → `UNSUPPORTED_METHOD`. Cross-namespace method → `UNAUTHORIZED_METHOD`.

### Acceptance criteria

- Every method in the allow-list is proxied to the correct chain RPC and returns the expected shape; MSW-mocked integration test covers the happy paths.
- `eth_accounts` / `eth_chainId` / `net_version` answered locally without an RPC round-trip.
- `wallet_switchEthereumChain` to a deployed chain: dispatches `switchActiveChain`, updates sessions, responds `null`; to a non-deployed chain: responds `4901`.
- `wallet_getCapabilities` returns `{atomicBatch: {supported: true}}` per approved chain.
- `wallet_getCallsStatus` returns the tracked Safe-tx status for a known `safeTxHash`.
- `wallet_showCallsStatus` navigates to the correct screen.
- Each of `personal_sign`, `eth_sign`, `eth_signTypedData{,_v3,_v4}`, `safe_setSettings` returns `UNSUPPORTED_METHOD` and does not open any UI — verified by router unit test.
- A `session_authenticate` event is rejected via `rejectSessionAuthenticate({reason: UNSUPPORTED_METHOD})` without opening any UI.
- Unknown / cross-namespace methods return the expected SDK errors.
- Unit tests for `readRpcProxy.ts`, the wallet-control handlers, and the unsupported-method/event reject paths.
- Manual QA: against a dApp that exercises `eth_call` + `wallet_switchEthereumChain`; verify a dApp that calls `personal_sign` receives the expected error and surfaces it cleanly on its side.

**Designs:** n/a — router-only ticket; no new UI surfaces.

**Depends on:** Ticket 2 (`methodRouter`).

---

## Ticket 9 — E2E: Pairing & session approval

### Problem

The pairing-and-approval flow is the entry point for everything else in this feature. Without automated coverage, every PR risks silently breaking either the scanner, the deep-link route, or the proposal sheet — and manual QA against real dApps is slow and flaky. Mobile's existing E2E suite uses Maestro (`apps/mobile/e2e/`) with one folder per feature area; we need a `walletconnect-dapps/` folder that covers this flow end-to-end.

Real WalletConnect relay pairing is too flaky for Maestro: the timing of `session_proposal` arrival depends on a live relay node and an external dApp fixture. We need a test-only hook that lets Maestro drive the WalletKit event surface deterministically.

### Solution

Add the E2E test scaffolding plus Maestro flows for the pairing path:

**Scaffolding (lands with this ticket, reused by Tickets 10 and 11):**

- Add a debug hook to `WalletKitProvider`, enabled only when `process.env.EXPO_PUBLIC_E2E === '1'` (or the equivalent existing E2E flag used by `connect-signer/`). The hook exposes a global accessible from Maestro's `runScript` directive that synthesises `session_proposal`, `session_request`, and `session_delete` events with fixture payloads. Mirrors the stubbing pattern WA-1858 set up for Connect Signer.
- Fixture payloads (Uniswap-shaped proposal, scam-flagged proposal, unverified proposal, etc.) live under `apps/mobile/e2e/tests/walletconnect-dapps/fixtures/`.
- New `apps/mobile/e2e/tests/walletconnect-dapps/` folder with shared utils and a `config.yaml` entry.

**Maestro flows (under `apps/mobile/e2e/tests/walletconnect-dapps/`):**

- `pair-scan-happy.yaml` — open header QR button → scan a fixture wc: QR → assert spinner → synthesise `session_proposal` (VALID dApp) → proposal sheet opens → tap Connect → success toast → assert session present in slice via test-id.
- `pair-scan-invalid.yaml` — open scanner → scan a non-wc QR → assert error overlay → tap Try again → scanner resets.
- `pair-scan-timeout.yaml` — open scanner → scan valid wc QR → no synthesised proposal arrives → assert error overlay after 10s.
- `pair-deep-link.yaml` — launch app with a `wc://` deep link → synthesise `session_proposal` → assert proposal sheet opens without the scanner being mounted.
- `pair-proposal-reject.yaml` — synthesise `session_proposal` → proposal sheet opens → swipe down to dismiss → assert `rejectSession` was called (via a side-channel test-id or telemetry log).
- `pair-proposal-unverified.yaml` — synthesise `session_proposal` with `UNKNOWN` verify status → open details panel via URL info icon → assert red banner copy and "Only continue if you trust the source." line.

### Acceptance criteria

- `apps/mobile/e2e/tests/walletconnect-dapps/` folder exists with `config.yaml`, `fixtures/`, and the six flows listed above.
- The debug-mode event-synthesis hook is wired in `WalletKitProvider`, gated by the E2E env flag, and unreachable in production builds.
- All six flows pass locally (`yarn workspace @safe-global/mobile e2e:run --include-tags=walletconnect-dapps` or the equivalent Maestro tag invocation).
- Flows run in CI under the same job that already runs `connect-signer` E2E.
- Telemetry / test-id side-channels used in the flows are documented in the folder's `README.md`.

**Depends on:** Tickets 3 and 4 implementations merged; the implementation of the debug hook is part of this ticket itself.

---

## Ticket 10 — E2E: Connected dApps management

### Problem

The Connected dApps settings flow has three independent entry points to disconnect (3-dots menu, swipe, dApp-initiated `session_delete`) and a conditional empty state. These are easy to regress when refactoring the settings stack or the swipeable row. Maestro coverage prevents that.

### Solution

Maestro flows under `apps/mobile/e2e/tests/walletconnect-dapps/` (folder created by Ticket 9):

- `manage-entry-hidden-when-empty.yaml` — open account settings with no sessions in the slice → assert "Connected apps" row is absent.
- `manage-entry-visible.yaml` — synthesise one session in the slice → open settings → assert "Connected apps" row with count 1 + chevron.
- `manage-disconnect-via-menu.yaml` — open list → tap 3-dots on a row → tap Disconnect → confirm modal → tap Confirm → assert success toast + row removed.
- `manage-disconnect-via-swipe.yaml` — open list → swipe left on a row → tap trash → confirm modal → Confirm → assert success toast + row removed.
- `manage-disconnect-cancel.yaml` — open list → trigger disconnect via menu → tap Cancel on confirm modal → assert row still present and no toast shown.
- `manage-disconnect-from-dapp.yaml` — open list → synthesise a `session_delete` event for one of the rows → assert row removed and **no** toast shown (dApp-initiated path).

Reuses the event-synthesis hook and fixture format introduced by Ticket 9.

### Acceptance criteria

- All six flows under `apps/mobile/e2e/tests/walletconnect-dapps/` pass locally and in CI.
- The "dApp-initiated disconnect shows no toast" assertion is verified explicitly (negative assertion on toast presence within a reasonable wait window).
- Cancel path leaves the slice and UI unchanged.

**Depends on:** Ticket 6 implementation merged; Ticket 9 (provides the event-synthesis hook).

---

## Ticket 11 — E2E: Transaction request flow

### Problem

The transaction-request path is the highest-value flow this feature exposes and also the riskiest: an `eth_sendTransaction` arriving from a dApp needs to be decoded, presented for signing, signed via the existing review-and-confirm tail, and acknowledged to the dApp with the correct `safeTxHash`. There are several edge cases (read-only Safe, CGW failure, EIP-5792 batch, user rejection) that should not regress.

### Solution

Maestro flows under `apps/mobile/e2e/tests/walletconnect-dapps/`:

- `tx-send-happy.yaml` — synthesise an active session → synthesise an `eth_sendTransaction` request with a fixture `{to, value, data}` → assert `SendTransactionSheet` opens with decoded payload → tap Sign → drive through the review-and-confirm tail → assert `safeTxHash` is delivered back to the synthesiser stub (via test-id or telemetry side-channel) and that the Safe tx appears in the local queue UI.
- `tx-send-reject.yaml` — same setup → tap Reject → assert `formatJsonRpcError(USER_REJECTED)` delivered to the stub.
- `tx-send-batch.yaml` — synthesise `wallet_sendCalls` with a batch of two calls → assert both calls render in the sheet → sign → assert single `safeTxHash` returned with EIP-5792 shape `{ id: safeTxHash }`.
- `tx-send-readonly-safe.yaml` — switch the active Safe to a view-only fixture → synthesise an `eth_sendTransaction` → assert sheet does **not** open → assert toast with "Add a signer" CTA appears → assert `code: 4100` was returned to the stub.
- `tx-send-cgw-failure.yaml` — synthesise the request → mock CGW propose-tx endpoint to return a 5xx → assert inline error on the sheet → assert `-32603` returned to the stub.

CGW mocking uses the existing pattern from the `transactions/` Maestro suite (likely MSW or a stub server fixture — confirm at implementation time).

### Acceptance criteria

- All five flows pass locally and in CI.
- `safeTxHash` delivery in `tx-send-happy.yaml` is verified end-to-end (not just that the sheet closed cleanly).
- EIP-5792 response shape `{ id: ... }` is asserted explicitly in `tx-send-batch.yaml`.
- The read-only Safe negative path asserts both the absence of the sheet and the presence of the toast.

**Depends on:** Ticket 7 implementation merged; Ticket 9 (event-synthesis hook + folder scaffolding).

---

## Notes for the project manager

- **Sequencing.**
  - Ticket 1 is the hard prerequisite for everything else.
  - After 1, Ticket 2 lands first (provider + slice + host + deep-link routing).
  - Ticket 3 (proposal sheet) lands next — the core pairing UX, exercisable end-to-end via deep link without a scanner.
  - Tickets 4 (scanner), 6 (connected dApps mgmt), 7 (tx requests), 8 (read-only proxy + wallet-control) can run in parallel after 3.
  - Ticket 5 (My Code) depends on 4 (owns the sheet shell).
  - E2E tickets 9–11 land alongside or shortly after their implementation counterparts. Ticket 9 lands before 10/11 because it builds the Maestro folder scaffolding + the debug-mode event-synthesis hook that 10/11 reuse.
- **Estimates.** I've left estimates blank — rough sizes: 1: 3pt; 2: 5pt; 3: 5pt; 4: 3pt; 5: 2pt; 6: 3pt; 7: 5pt; 8: 5pt; 9: 5pt (includes the debug hook); 10: 2pt; 11: 3pt. Tune at refinement.
- **Open questions** carried from the design doc (see §11 of [design](https://github.com/safe-global/safe-wallet-monorepo/blob/dev/docs/superpowers/specs/2026-05-11-mobile-walletconnect-dapps-design.md)) should be resolved before kicking off the ticket they touch — most notably the `isScam` copy for Ticket 3 and the WalletKit `getPendingSessionRequests` API surface for Ticket 2. (The "Receive screen reuse" open question is now resolved — Ticket 5 reuses `ShareContainer`.)
- **Manual QA fixtures.** Each ticket asks for manual QA against a real dApp on iOS + Android. Suggest standardising on Uniswap (desktop) for pairing + transaction, and one read-only dApp (block explorer) for `eth_call`-heavy flows in Ticket 8.
