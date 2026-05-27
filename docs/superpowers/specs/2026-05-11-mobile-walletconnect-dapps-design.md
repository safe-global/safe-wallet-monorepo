# Mobile WalletConnect — Connect dApps to Safe

Design doc for the mobile-app feature that lets external dApps connect to a Safe and request signatures / transactions via WalletConnect. Companion to the existing "connect signer via WalletConnect" feature, which is the inverse direction.

- **Status:** draft, awaiting review
- **Date:** 2026-05-11
- **Linear:** https://linear.app/safe-global/project/walletconnect-dapps-deb873926e79/overview
- **Figma:** https://www.figma.com/design/vu5wqi31TtoJGpx3JfMR10/Wallet-Connect-dapps

## 1. Goals & non-goals

### In scope (v1)

- A Safe on mobile can act as a WalletConnect wallet so external dApps can:
  - Pair via QR code scanned from a desktop dApp (Part 1).
  - Pair via deep link from a mobile dApp (Part 3).
  - Request Safe-style transactions (`eth_sendTransaction`, EIP-5792 `wallet_sendCalls`), with read-only RPC proxying and wallet-control methods (`wallet_switchEthereumChain`, capability lookups). Off-chain message signing is explicitly excluded from this milestone — see "Out of scope" below.
- The user can manage and disconnect existing dApp connections from account settings (Part 2).
- A "My Code" tab inside the same sheet exposes the Safe address as a plain-address QR for receive-fund purposes, with a list of chains the Safe is deployed on.

### Out of scope (v1)

- Push-notification-driven wake-up to keep sessions alive while backgrounded — we accept WalletKit's relay reconnect-on-foreground model.
- ~~Detox~~ E2E coverage of less-critical flows (My Code tab, router-only paths). The user-facing flows are covered by Maestro E2E in dedicated tickets — see the ticket draft.
- Paste-from-clipboard fallback inside the Scan tab.
- `wallet_addEthereumChain` from dApps (Safe chains are managed centrally).
- `safe_setSettings` (Safe Apps proprietary) — returns `unsupported`.
- Auto-approve / trusted-dApps memory (web's `wcAutoApprove`). Every request requires explicit user action in v1.
- **Off-chain message signing** (`personal_sign`, `eth_sign`, `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4`). Mobile has no off-chain message-signing pipeline today; building one is a separate workstream. These methods return `UNSUPPORTED_METHOD` to the dApp.
- **SIWE / 1-Click Auth** (`session_authenticate`). Depends on off-chain signing (EIP-1271 over the auth message). Rejected via `rejectSessionAuthenticate({reason: UNSUPPORTED_METHOD})`.

## 2. Architectural approach

Add a new `@reown/walletkit` + `@walletconnect/core` stack that lives **alongside** the existing `@reown/appkit-ethers-react-native` used by the Signer feature. The two SDKs are different roles of the same WC protocol; they share no runtime state.

Folder layout:

```
apps/mobile/src/features/WalletConnect/
├── Signer/           # existing AppKit code, refactored into this subtree
├── Wallet/           # new dApp-connection feature, this design
└── shared/           # used by both Signer and Wallet
    ├── compat.ts                # '@walletconnect/react-native-compat' polyfill (side-effect import, once)
    ├── projectId.ts             # reads EXPO_PUBLIC_REOWN_PROJECT_ID
    ├── metadata.ts              # SAFE_WALLET_METADATA (name, description, url, icons)
    └── mmkvStorageAdapter.ts    # factory: createMmkvStorage(id) -> WC Storage adapter
```

The `shared/` subtree is populated as part of the Signer refactor: the metadata block currently inlined in `apps/mobile/src/features/WalletConnect/appKit.ts` (lines ~59–64), the MMKV storage adapter (lines ~12–41), the `projectId` constant (line 8), and the `react-native-compat` import (line 1) are all extracted there. Both `Signer/appKit.ts` and `Wallet/walletKit.ts` then consume from `shared/`.

Considered and rejected:

- **Share one Reown stack and multiplex roles.** AppKit owns its modal and Sign-client lifecycle; repurposing it as a wallet fights its intended API surface. Web took the parallel-stacks route for the same reason.
- **Build directly on `@walletconnect/sign-client`.** Skips WalletKit's value (verify API, `buildApprovedNamespaces`, `buildAuthObject`, deep-link routing). Mobile parity with web means we should use the same wrapper.

## 3. Module wiring & lifecycle

### Singleton

`Wallet/walletKit.ts` exports an async `getWalletKit()` that lazy-creates `Core` + `WalletKit.init({core, metadata})`:

- Storage: `createMmkvStorage('walletkit')` from `shared/mmkvStorageAdapter.ts` (distinct from Signer's `appkit` MMKV id).
- `projectId` imported from `shared/projectId.ts`.
- `metadata` imported from `shared/metadata.ts` — the same `SAFE_WALLET_METADATA` constant the Signer's AppKit also consumes.

### Provider

`WalletKitProvider` mounts at the same level as the existing `WalletConnectContext` in `apps/mobile/src/app/_layout.tsx`. On mount:

- Instantiate WalletKit.
- Seed Redux `walletKitSlice.sessions` from `getActiveSessions()`.
- Subscribe to: `session_proposal`, `session_request`, `session_delete`, `session_expire`, `session_update`, `session_authenticate`.
- For each subscribed event, the provider forwards to a dedicated handler in `Wallet/hooks/` (e.g. `useSessionProposalHandler`). `session_update` from the dApp side updates the mirror only if the new namespaces are still a subset of what we approved; otherwise we ignore (defensive — dApps shouldn't widen scope unilaterally).

### Active-Safe binding

The provider watches `selectActiveSafe`. When the active Safe changes, it calls `walletKit.updateSession({topic, namespaces})` for every active session to sync `accounts` and emits `chainChanged`/`accountsChanged` per session. If the user switches to a Safe that doesn't exist on a session's chain, we **do not auto-disconnect** — `wallet_switchEthereumChain` will handle that case.

### Deep links

`app.config.ts` adds an intent filter for `wc://` URIs. A `Linking` listener in the provider extracts the URI and calls the same `pair(uri)` entry as the scanner. Part 3 falls out of this for free.

### Lifecycle gotchas

- iOS background: relayer subscriptions don't survive long backgrounding. Sessions resume from MMKV on relaunch. No push-driven wake-up in v1.
- Storage is MMKV; Redux mirror is derived state (not persisted via redux-persist), seeded from `getActiveSessions()` on launch. This avoids drift.
- Redux mirror holds only display-side fields: `{topic, peerMetadata, chains, accounts, expiry}`. No keys or secrets.

### Read-only Safe behaviour

A Safe in the mobile store can be view-only (no signer attached). Behaviour:

- The header QR button stays visible — connecting itself is harmless, and the user may want the dApp to be able to read balances or display the address.
- `session_proposal` is allowed and approved as normal.
- Category-A (transaction) `session_request`s (`eth_sendTransaction`, `wallet_sendCalls`) are immediately rejected with `formatJsonRpcError(id, { code: 4100, message: 'No signer attached to this Safe' })` (4100 = `Unauthorized` per EIP-1193). The send-tx sheet is **not** opened. A toast informs the user that a transaction request was declined because no signer is attached, with a CTA "Add a signer".
- Category-B (read-only proxy) and Category-C (`wallet_switchEthereumChain`, capabilities lookups) remain functional — they don't require a signer.

### In-app request routing

Signing sheets (Category A in §6) need to surface regardless of which screen the user is on. They mount via a root-level `RequestSheetHost` rendered inside `WalletKitProvider`. The host is a `@gorhom/bottom-sheet` modal with `enablePanDownToClose={false}` and `backdropProps={{ pressBehavior: 'none' }}` — i.e. modal-strict; the user must explicitly Reject or Sign. This mirrors web's behaviour of blocking background interaction on the SafeApps tx flow.

A `currentRequest: SessionRequest | null` selector drives the host. Only one request is shown at a time; additional incoming `session_request`s land in `walletKitSlice.pendingRequests: SessionRequest[]` (FIFO). When `currentRequest` resolves (signed / rejected / errored), the host pulls the head of `pendingRequests` and sets it as `currentRequest`. This serialises potentially-concurrent requests from multiple dApps in a predictable order.

Per-request expiry is enforced by WalletKit (default ~5 min); on expiry, the slice removes the request without showing it. If the user backgrounds the app and the head request expires while away, we drop it silently and pull the next.

### Pending requests on relaunch

On `WalletKit.init()`, WalletKit's internal store may already contain pending `session_request`s the user never resolved before quitting the app. The provider calls `getPendingSessionRequests()` after init, seeds them into `walletKitSlice.pendingRequests` ordered by timestamp, and `RequestSheetHost` picks them up. WalletKit drops requests older than its expiry window; we don't need to filter manually.

## 4. Pairing & session approval (Parts 1 + 3)

### Trigger surfaces

All funnel into `walletKit.pair({uri})`:

1. Header QR button → opens `ScanConnect` bottom sheet (Scan tab default).
2. "My Code" tab inside the same sheet.
3. `Linking` event with a `wc:`/`wc://` URI (Part 3).

### URI handling

`pair({uri})` wrapped in try/catch. On parse/network failure → scanner shows the inline error overlay (Figma 16204:6016) with a Try again CTA. On success, `pair` resolves quickly; the proposal arrives via a separate `session_proposal` event.

### Pairing-to-proposal handoff

Scanner sheet stays open with a loading overlay until `session_proposal` fires (10s timeout) → scanner closes, proposal sheet opens. Timeout/error → scanner shows error overlay. A `pendingPair` ref correlates `pair` ↔ event.

### Proposal sheet — main state (Figma 16041:2924)

- Title "Connection request".
- 48×48 dApp logo (from `params.proposer.metadata.icons[0]`) + verify-status badge in the bottom-right corner. If the icon URL fails to load or is absent, fall back to a generic dApp placeholder (the same one used by the connected-dApps list when an icon is missing).
- dApp name.
- URL pill with info icon (tap → opens details panel).
- Primary CTA: **Connect**.
- Dismissal (swipe down or backdrop tap) → `rejectSession({id, reason: USER_REJECTED})`.

### Details panel (Figma 16041:3229 / 16204:5236)

Static permissions-explainer, _not_ a chains/methods inspector. The dApp-supplied namespaces are entirely consumed by `services/namespaces.ts` and never reach the UI.

Layout:

1. **Verify-status banner** (the only dynamic region):
   - `VALID` → green bg `#173026`, filled check, "This domain has been verified."
   - `UNKNOWN`/`INVALID` → red bg `#4a2125`, alert icon, "This domain could not be verified." **Plus** bold paragraph below the bullets: "Only continue if you trust the source."
   - `isScam` → same red variant; copy stronger (placeholder "This domain has been flagged as malicious." — confirm with design at build time).
2. **"This website will be able to:"** bullets:
   - ✓ View your balance and activity
   - ✓ Request transactions approval
3. **"This website won't be able to:"** bullets:
   - ✗ Move funds without permission
4. CTA: **"Got it"** — closes the details panel only; user returns to the main proposal sheet.

`ConnectionPermissionsPanel` takes a single prop `verifyStatus: 'verified' | 'unverified' | 'malicious'`. Bullets are static.

### Namespace construction

`services/namespaces.ts` wraps `buildApprovedNamespaces` from `@walletconnect/utils`:

- `chains`: intersection of (dApp's required + optional eip155 chains) ∩ (chains this Safe is deployed on, read from `state.safes[activeAddress]`). Empty intersection on **required** chains → auto-reject with `UNSUPPORTED_CHAINS`.
- `accounts`: `eip155:<chainId>:<safeAddress>` for each chain in the intersection. Safe address is emitted as **EIP-55 checksum** form (matches web's `getAddress()` output) — CAIP-10 is checksum-agnostic but several dApps string-match.
- `methods`: `WALLET_SUPPORTED_METHODS` constant (mirrors web's `constants.ts`).
- `events`: `['chainChanged', 'accountsChanged']`.

### Auto-reject conditions

- Active Safe is null (header button hidden in this case, but defensive).
- Required namespaces include a non-eip155 namespace → `UNSUPPORTED_NAMESPACE_KEY`.
- Required chains contain a chain the Safe is not deployed on → `UNSUPPORTED_CHAINS`.

### Verify-status policy

Warn-not-block, even for `isScam`. The status badge and banner update, but the Connect CTA remains enabled — mirrors web.

### Outcome

- Success → top toast (Figma 16002:3870). Session metadata persisted. Deep-link redirect back to dApp (WalletKit auto when `sessionConfig.disableDeepLink === false`).
- Failure → error toast (Figma 16005:1400).

## 5. UI surfaces

### Header QR button

A 40×40 icon button in the home/account header, `background/skeleton` background, 24×24 QR icon. Hidden when `selectActiveSafe` returns null. Exact position between chain selector and pending-tx button to be confirmed against the navbar component at wiring time.

### `ScanConnect` bottom sheet

A `@gorhom/bottom-sheet` modal with a segmented control toggling **Scan QR** ↔ **My Code**.

**Scan QR tab (Figma 16002:3012):**

- Reuses `apps/mobile/src/components/Camera/QrCamera.tsx` (already used by the Signer feature for WC URI scanning).
- Pass a `validator` that recognises `wc:` and rejects anything else inline.
- On valid URI → call `walletKit.pair({uri})`, show inline spinner overlaying the camera with "Connecting…", wait for `session_proposal` (10s).
- On event → close sheet, open `SessionProposalSheet`.
- On timeout/error → swap to error overlay with Try again CTA (resets state, doesn't reopen camera).
- Camera permission via existing `react-native-vision-camera` flow.

**My Code tab (Figma 16202:4931):**

- QR code of the active Safe's plain address (not a `wc:` URI). Library: `react-native-qrcode-svg` (confirm in dep tree at build time, add if needed).
- Below QR: truncated address + tap-to-copy.
- Below address: row of network icons for chains the Safe is deployed on (`state.safes[activeAddress]`). Tap row → opens deployment-network list modal (Figma 16203:5157).
- Open question to resolve at build time: if a Receive screen already exists in the app, prefer inlining its component or routing into it from the toggle, rather than building a parallel implementation.

### Connected dApps settings entry (Figma 16024:1774)

Below the Signers entry in account settings. Conditionally rendered when `Object.keys(sessions).length > 0`. Right accessory shows the session count + chevron.

### Connected dApps screen (Figma 16024:2155)

Standard route under the Settings stack. Each row:

- dApp icon + verify badge.
- dApp name + URL.
- 3-dots menu trigger → context menu with "Disconnect" (Figma 16204:6150).
- Swipe-left reveals trash button (Figma 16024:2929) — same effect as Disconnect.

Both Disconnect entry points route through a single `disconnectSession(topic)` helper.

### Disconnect confirm modal (Figma 16120:3638)

"Disconnect [dApp]?" + Confirm/Cancel. Confirm calls `walletKit.disconnectSession({topic, reason: getSdkError('USER_DISCONNECTED')})`, removes the session from the slice, dismisses the modal, shows the success toast (Figma 16066:7568).

### Disconnect rules

- **User-initiated disconnect** (3-dots menu or swipe) → confirm modal → on confirm: `walletKit.disconnectSession(...)`, slice removes the session, modal dismisses, toast shown.
- **dApp-initiated disconnect** (`session_delete` event arriving from WalletKit) → slice removes the session silently; no toast.

## 6. RPC method handling

`services/methodRouter.ts` subscribes to `session_request` and dispatches by `params.request.method`. Three categories:

### Category A — Transaction requests (state-changing, needs user UI)

| Method                        | UI                                                                                                                | Output                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `eth_sendTransaction`         | `SendTransactionSheet`: dApp identity, chain badge, decoded `{to, value, data}`, gas hints, Reject/Sign-and-queue | Returns `safeTxHash` to dApp |
| `wallet_sendCalls` (EIP-5792) | Same sheet, rendered as batch of N calls                                                                          | Returns `{ id: safeTxHash }` |

Off-chain message signing (`personal_sign`, `eth_sign`, `eth_signTypedData{,_v3,_v4}`) is out of scope for this milestone — see §1 and the unsupported list below.

**`eth_sendTransaction` / `wallet_sendCalls` path**:

1. Build the Safe transaction directly from the dApp-supplied `{to, value, data}` (or array) — no token/recipient form needed.
2. `proposeNewTransaction()` to CGW (unsigned) → returns `safeTxHash`.
3. Reuse `useTransactionSigning` to sign.
4. **Respond to the dApp with `safeTxHash` as soon as the user signs**, not waiting for execution. Matches web.

Reuses the existing review-and-confirm tail at `apps/mobile/src/app/review-and-confirm.tsx` for the sign step, but with a fresh composer that accepts arbitrary call data.

### Category B — Read-only RPC proxy

`services/readRpcProxy.ts` builds an ethers v6 `JsonRpcProvider` for the requested `params.chainId`. RPC URL resolution uses the chain config from `packages/store/src/gateway/chains/`. The proxy is **only** invoked for methods in the read-only allow-list.

Allow-list (from web's `constants.ts`):
`eth_blockNumber`, `eth_getBalance`, `eth_getCode`, `eth_getTransactionCount`, `eth_getStorageAt`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_estimateGas`, `eth_call`, `eth_getLogs`, `eth_gasPrice`.

`eth_accounts`, `eth_chainId`, `net_version` are answered locally (active Safe address / chain). `wallet_getCapabilities` and `wallet_getCallsStatus` are handled locally in Category C below (not proxied to a chain RPC).

### Category C — Wallet-control methods

| Method                       | Behavior                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wallet_switchEthereumChain` | If target `chainId` is in the Safe's deployed chains, dispatch `switchActiveChain({chainId})` + `walletKit.updateSession`; respond `null` (per EIP-3326). Otherwise respond `{code: 4901, message: 'Safe is not deployed on this chain'}` (aligns with web). |
| `wallet_getCapabilities`     | Return `{atomicBatch: {supported: true}}` per chain.                                                                                                                                                                                                         |
| `wallet_getCallsStatus`      | Return the local Safe-tx status for the `safeTxHash` issued by an earlier `wallet_sendCalls` (matches web's behavior of tracking the in-flight Safe transaction).                                                                                            |
| `wallet_showCallsStatus`     | Navigate to the Safe queue/transaction-detail screen for the `safeTxHash`.                                                                                                                                                                                   |
| `safe_setSettings`           | Return `UNSUPPORTED_METHOD` in v1.                                                                                                                                                                                                                           |

### Unsupported (return `UNSUPPORTED_METHOD`)

The router responds to these without opening any UI:

- `personal_sign`, `eth_sign`
- `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4`
- `safe_setSettings`

A `session_authenticate` event from a dApp is rejected via `walletKit.rejectSessionAuthenticate({ id, reason: getSdkError('UNSUPPORTED_METHOD') })`. No proposal sheet is opened for it. Should off-chain signing land in a future milestone, this handler grows into the full 1-Click Auth flow (sign the auth message via the EIP-1271 path, build the auth object with `buildAuthObject(... 'eip1271' ...)`, then `approveSessionAuthenticate({id, auths})`).

### Errors

- Unknown method → `UNSUPPORTED_METHOD`.
- Request for a chain not in the session's approved namespaces → `UNAUTHORIZED_METHOD`.
- User dismisses a signing sheet → `USER_REJECTED`.
- App backgrounded mid-request → request stays queued in WalletKit; on foreground if still valid, sheet re-opens (default request expiry ~5 min).
- Signing fails (signer disconnected, hardware error) → propagate via `formatJsonRpcError`.

### Telemetry

Mirror web: log `pair` success/failure, `approveSession`, each `session_request` method dispatched (count + success/error), `disconnectSession` (user vs dApp).

## 7. Error handling, edge cases — full table

| Failure                                                       | Surfaces as                                                                                                                    | Recovery                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Camera can't read QR                                          | Scanner error overlay (Figma 16204:6016)                                                                                       | Try again                                                     |
| QR is not a `wc:` URI                                         | Same                                                                                                                           | Try again                                                     |
| `pair()` throws (expired URI, bad symKey, network)            | Same; details logged                                                                                                           | Try again or close                                            |
| `session_proposal` doesn't arrive within 10s                  | Scanner error overlay, "Couldn't reach the dApp"                                                                               | Try again                                                     |
| Required chains unsupported                                   | Auto-reject with `UNSUPPORTED_CHAINS`; error toast (Figma 16005:1400)                                                          | None                                                          |
| Required non-eip155 namespace                                 | Auto-reject with `UNSUPPORTED_NAMESPACE_KEY`; error toast                                                                      | None                                                          |
| User dismisses proposal sheet                                 | `rejectSession(USER_REJECTED)`; silent                                                                                         | —                                                             |
| `approveSession()` throws                                     | Error toast                                                                                                                    | Retry from dApp                                               |
| dApp `INVALID`/`UNKNOWN` verify status                        | Red banner + "Only continue if you trust the source."                                                                          | Connect still enabled                                         |
| dApp `isScam`                                                 | Same red variant, stronger copy                                                                                                | Connect still enabled                                         |
| Tx request: user rejects                                      | `formatJsonRpcError(id, USER_REJECTED)`; silent                                                                                | —                                                             |
| Tx request: signer disconnected                               | Sheet shows error + reconnect CTA; dApp gets `USER_REJECTED` after user dismisses                                              | Reconnect signer via Signer flow                              |
| `eth_sendTransaction`: tx propose fails (CGW error)           | Inline error on send sheet; dApp gets `-32603`                                                                                 | Retry/cancel from sheet                                       |
| dApp calls a signing method (`personal_sign` etc.)            | Router responds `UNSUPPORTED_METHOD` without opening UI                                                                        | dApp typically surfaces the rejection itself                  |
| dApp sends `session_authenticate`                             | `rejectSessionAuthenticate(UNSUPPORTED_METHOD)`; silent                                                                        | dApp may fall back to a plain `session_proposal`              |
| Active Safe is null when proposal arrives                     | Auto-reject; silent                                                                                                            | Select Safe, retry from dApp                                  |
| Active Safe changes off the session's chains                  | Session stays; future requests for unauthorized chains → `UNAUTHORIZED_METHOD`                                                 | User switches back or disconnects                             |
| Session expiry (8 days default)                               | WalletKit removes; slice mirrors via `session_expire`; silent                                                                  | Pair again                                                    |
| App killed/backgrounded for hours                             | Relayer reconnects on relaunch; sessions resume from MMKV; requests beyond ~5 min expired by WalletKit and silently dropped    | —                                                             |
| Deep link arrives while sheet showing                         | Queue new URI; process after current proposal resolves                                                                         | —                                                             |
| Multiple `pair()` before any proposal                         | Track only the latest `pendingPair`; earlier ones abandoned. The matching `session_proposal` still arrives and shows its sheet | —                                                             |
| Transaction request on a read-only Safe (no signer)           | Auto-reject with `{code: 4100, message: 'No signer attached to this Safe'}`; toast with "Add a signer" CTA                     | User attaches a signer via existing Signer flow, dApp retries |
| dApp icon URL fails to load or missing                        | Render generic dApp placeholder icon                                                                                           | —                                                             |
| Relayer disconnects mid-signing                               | Sign sheet shows "Connection lost — retry" inline state; tapping retry re-attempts the relay submission; user can also Reject  | —                                                             |
| `session_request` arrives while another request sheet is open | Enqueue in `pendingRequests`; processed FIFO when current resolves                                                             | —                                                             |
| Pending request found in WalletKit store on app launch        | Seeded into `pendingRequests`; `RequestSheetHost` shows the head request once the active Safe is selected                      | —                                                             |

## 8. Permissions

- iOS: camera (`NSCameraUsageDescription` already declared for existing scanner; reuse).
- Android: `CAMERA` runtime permission, same as existing.
- No new background-modes / push-notification permissions in v1.

## 9. iOS-specific: AppKit modal coexistence

The existing AppKit modal renders inside a `FullWindowOverlay` on iOS. Our WalletKit sheets do **not** nest under that overlay (it's owned by AppKit). Sheets mount at the same `_layout.tsx` level as the AppKit overlay. `@gorhom/bottom-sheet`'s portal renders at root regardless.

## 10. Testing strategy

### Unit tests (Jest, colocated `*.test.ts(x)`)

| File                                                    | Covers                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Wallet/services/namespaces.test.ts`                    | `buildSupportedNamespaces` intersection; non-eip155 → throws; chain not deployed → throws; happy path                                                                                                                                                                                                                                     |
| `Wallet/services/methodRouter.test.ts`                  | Routes each supported method to the correct handler; signing methods (`personal_sign`, `eth_sign`, `eth_signTypedData{,_v3,_v4}`) and `safe_setSettings` → `UNSUPPORTED_METHOD`; unknown method → `UNSUPPORTED_METHOD`; cross-namespace → `UNAUTHORIZED_METHOD`; `session_authenticate` → `rejectSessionAuthenticate(UNSUPPORTED_METHOD)` |
| `Wallet/services/readRpcProxy.test.ts`                  | MSW-mocked JSON-RPC; allow-listed methods proxy correctly; `eth_chainId`/`eth_accounts`/`net_version` answered locally                                                                                                                                                                                                                    |
| `Wallet/store/walletKitSlice.test.ts`                   | Reducers + selectors                                                                                                                                                                                                                                                                                                                      |
| `Wallet/hooks/useApproveSession.test.tsx`               | Approve calls `approveSession` with computed namespaces; reject calls `rejectSession`; toast on success                                                                                                                                                                                                                                   |
| `Wallet/hooks/useRpcMethodHandlers.test.tsx`            | `wallet_switchEthereumChain` in-set vs out-of-set behavior                                                                                                                                                                                                                                                                                |
| `Wallet/components/SessionProposalSheet.test.tsx`       | Verify-status variants; Connect/Reject paths; details panel toggle                                                                                                                                                                                                                                                                        |
| `Wallet/components/ConnectionPermissionsPanel.test.tsx` | All three banner states                                                                                                                                                                                                                                                                                                                   |
| `Wallet/components/SendTransactionSheet.test.tsx`       | Single-tx + EIP-5792 batch shape; returns `safeTxHash`                                                                                                                                                                                                                                                                                    |
| `Wallet/components/ConnectedDappsScreen.test.tsx`       | Empty state hides settings entry; populated list; swipe + 3-dots actions                                                                                                                                                                                                                                                                  |

### Integration test

`Wallet/__integration__/connect-and-send-tx.test.tsx` — wires the real slice and a fully-mocked WalletKit. Drives: scan URI → proposal event → connect → `eth_sendTransaction` event → send-tx sheet → approve → assert `safeTxHash` returned to dApp.

### Test utilities to add to `apps/mobile/src/tests/utils/`

- `mockWalletKit()`
- `mockSessionProposal(overrides)`
- `mockSessionRequest(method, params, overrides)`

### Maestro E2E

User-facing flows (pairing, dApp management, transaction requests) are covered by Maestro flows under `apps/mobile/e2e/tests/walletconnect-dapps/` and tracked in dedicated tickets. Real WC relay pairing is too flaky for Maestro, so a debug-mode hook on `WalletKitProvider` synthesises `session_proposal`/`session_request`/`session_delete` events from test fixtures — mirroring the pattern WA-1858 set for Connect Signer.

### Explicitly out of scope

- Jest snapshot tests — visual regressions tracked via the Figma sync skill.

## 11. Open questions

1. Exact position of the header QR button (between chain selector and pending-tx button, per the brief — confirm against current navbar component when wiring).
2. Whether a Receive screen already exists that can host the "My Code" tab's address-QR component, vs. building it inside the sheet.
3. Final copy for the `isScam` verify banner — needs a Figma confirmation.
4. Whether `react-native-qrcode-svg` is already in the dep tree (used elsewhere) or needs to be added.
5. Telemetry plumbing — confirm whether mobile has a `logTrackedException`-equivalent and adopt it.
6. Toast copy for the "transaction rejected — no signer attached" case — needs design input.
7. Confirm the WalletKit API surface for pending-request enumeration (`getPendingSessionRequests`) — version-pin at install time.

## 12. Ticket breakdown (to be drafted next)

The Signer-refactor ticket runs first and unblocks everything else: it moves the existing `apps/mobile/src/features/WalletConnect/` contents into `Signer/`, extracts the shared scaffolding into `shared/` (compat, projectId, metadata, MMKV adapter), and updates every importer. This is a mechanical change but touches a wide import surface — owning it as a discrete PR keeps the new-feature PRs focused on actual product work.

Eleven follow-on engineering-sized tickets are planned for the new feature (eight implementation + three Maestro E2E), sized to be independently reviewable. See the ticket draft at [2026-05-12-mobile-walletconnect-dapps-tickets.md](./2026-05-12-mobile-walletconnect-dapps-tickets.md).
