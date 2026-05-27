# Mobile WalletConnect dApps — POC (wallet-side) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single PR adding `apps/mobile/src/features/WalletConnect/Wallet/` that lets the Safe mobile app act as a WalletConnect _wallet_ — pair with dApps, present session proposals, route session requests through a method router, build Safe-tx drafts for `eth_sendTransaction` / `wallet_sendCalls`, and let users sign through the existing review-and-confirm flow.

**Architecture:** New `Wallet/` sibling to `Signer/` and `shared/` under the WalletConnect feature. A `@reown/walletkit` singleton on a separate `walletkit` MMKV id. A new `walletKitSlice` holds sessions + pendingRequests as derived state (not redux-persist) — WalletKit's MMKV storage is the source of truth across restarts. A `WalletKitProvider` mounts the singleton, subscribes to WalletConnect events, and mounts a modal-strict `RequestSheetHost` that switches between proposal / transaction / error sheets based on the current pending request. Transactions are composed into a `DraftTx` via the existing `synthesizeDraftTxDetails` utility, stashed in `draftTxSlice` keyed by `safeTxHash`, and the user is navigated to `review-and-confirm` which auto-detects the draft via `useTransactionData`. A method router handles all session_request methods, with a read-only ethers `JsonRpcProvider` proxy for an allow-listed subset of read methods.

**Tech Stack:** Expo + React Native, TypeScript, Redux Toolkit, `@reown/walletkit`, `@walletconnect/core`, `@walletconnect/utils`, `@safe-global/protocol-kit`, `ethers` v6, Tamagui, `@gorhom/bottom-sheet`, `react-native-vision-camera`.

**Branch & assumptions:** Branch off `dev`. The plan assumes `dev` already contains:

- PR #7912 (Signer refactor) — provides `apps/mobile/src/features/WalletConnect/Signer/` and `apps/mobile/src/features/WalletConnect/shared/{compat,projectId,metadata,mmkvStorageAdapter}.ts`.
- The `danield/mobile-tx-preview` merge — provides `apps/mobile/src/store/draftTxSlice.ts`, `apps/mobile/src/features/ConfirmTx/utils/synthesizeDraftTxDetails.ts`, the `prebuiltSafeTx` signer param in `apps/mobile/src/services/tx/tx-sender/sign.ts`, the draft short-circuit in `apps/mobile/src/features/ConfirmTx/hooks/useTransactionData.ts`, and the `transactionsPreviewTransactionV1` mutation in `packages/store`.

**Tests:** Per spec, this PR adds no Jest test files. Each task uses `yarn workspace @safe-global/mobile type-check` and `yarn workspace @safe-global/mobile lint` as the verification gate. A final manual smoke-test phase walks the 10 acceptance criteria from the spec.

**Spec:** [docs/superpowers/specs/2026-05-26-mobile-walletconnect-dapps-poc-wallet.md](../specs/2026-05-26-mobile-walletconnect-dapps-poc-wallet.md)

---

## Phase 0 — Dependencies & branch setup

### Task 0.1: Branch off `dev` and add WalletKit dependencies

**Files:**

- Modify: `apps/mobile/package.json`
- Modify: `yarn.lock` (auto-updated by yarn)

- [ ] **Step 1: Confirm prerequisites on `dev`**

Check by filesystem state rather than commit messages — merge titles aren't load-bearing, the files those merges introduced are.

```bash
git fetch origin dev
git checkout dev
git pull
test -d apps/mobile/src/features/WalletConnect/Signer || { echo "MISSING: Signer/ — PR #7912 not on dev"; exit 1; }
test -d apps/mobile/src/features/WalletConnect/shared || { echo "MISSING: shared/ — PR #7912 not on dev"; exit 1; }
test -f apps/mobile/src/store/draftTxSlice.ts || { echo "MISSING: draftTxSlice.ts — danield/mobile-tx-preview not merged"; exit 1; }
test -f apps/mobile/src/features/ConfirmTx/utils/synthesizeDraftTxDetails.ts || { echo "MISSING: synthesizeDraftTxDetails.ts"; exit 1; }
test -f apps/mobile/src/services/tx/tx-sender/sign.ts || { echo "MISSING: sign.ts (prebuiltSafeTx host)"; exit 1; }
echo "Prerequisites confirmed on dev"
```

If any check fails, STOP — the plan's assumptions are violated. Coordinate with whoever owns the missing merge before branching.

- [ ] **Step 2: Create the feature branch**

```bash
git checkout -b feat/mobile-walletconnect-dapps-poc
```

- [ ] **Step 3: Add WalletKit deps**

Add to `apps/mobile/package.json` `dependencies` (insert alphabetically near `@reown/appkit-react-native`):

```json
"@reown/walletkit": "^1.0.0",
"@walletconnect/core": "^2.21.0",
"@walletconnect/utils": "^2.21.0"
```

Pin to versions compatible with the installed `@reown/appkit-ethers-react-native` / `@reown/appkit-react-native`. Check the existing versions, then look at `@reown/walletkit`'s peerDependency on `@walletconnect/core` — they must agree. If they don't, downgrade WalletKit to the latest version whose peerDep matches AppKit's bundled `@walletconnect/core`.

Run:

```bash
yarn install
```

- [ ] **Step 4: Verify dependency install**

```bash
yarn workspace @safe-global/mobile type-check
```

Expected: PASS (no type changes yet; this just confirms install didn't break anything).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json yarn.lock
git commit -m "chore(mobile): add @reown/walletkit + @walletconnect/core for dApp POC"
```

---

## Phase 1 — Core infrastructure (singleton, slice, types)

### Pre-implementation: imports to verify in one sweep

The plan flags several import paths and selector names that are _probably_ right but weren't visible to the planner. Resolve them all up front so later tasks compile clean. For each, grep the repo, then either confirm or substitute the working name across all snippets where it appears:

| Symbol                                | Path used in plan                            | Used in tasks | Fallback if not found                                                                                        |
| ------------------------------------- | -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `selectChainsSupportedBySafe`         | `@/src/store/chains`                         | 3.1, 4.2, 5.1 | Derive from `useSafesGetSafeV1Query`'s response or compose from chains slice + active Safe's deployment list |
| `selectSafeState`                     | `@/src/store/safes`                          | 4.3, 5.1      | Use `useSafesGetSafeV1Query({chainId, safeAddress})` directly in the component (see Task 4.3 note)           |
| `selectActiveSigner`                  | `@/src/store/activeSignerSlice`              | 5.1           | Check `apps/mobile/src/store/activeSignerSlice.ts` for the exact export name                                 |
| `switchActiveChain`                   | `@/src/store/activeSafeSlice`                | 5.1           | Whatever action the existing chain-switcher in the navbar dispatches                                         |
| `useSafeToast`                        | `@/src/components/Toast`                     | 3.2, 7.1      | Grep an existing call site (settings/send flow) for the project's toast helper                               |
| `SafeListItem`                        | `@/src/components/SafeListItem/SafeListItem` | 7.2           | Existing settings rows import it; copy the import                                                            |
| `SafeFontIcon` name `apps`, `qr-code` | `@/src/components/SafeFontIcon/types.ts`     | 4.6, 7.2      | Whichever icon names exist in the enum                                                                       |
| `QrCamera` prop shape                 | `@/src/components/Camera/QrCamera`           | 4.5           | Inspect the Signer's WC URI scanner usage                                                                    |
| `Verify.Context['verified']`          | `@walletconnect/types`                       | 1.3           | Inline the literal `{ validation, isScam }` type                                                             |
| `IWalletKit`                          | `@reown/walletkit`                           | 1.1 + many    | Fallback: `Awaited<ReturnType<typeof WalletKit.init>>`                                                       |

Resolving these up front (one `grep` session) avoids interrupting later tasks.

---

### Task 1.1: `Wallet/walletKit.ts` singleton

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/walletKit.ts`

- [ ] **Step 1: Write the singleton module**

```ts
import { Core } from '@walletconnect/core'
import { WalletKit, type IWalletKit } from '@reown/walletkit'
import { createMmkvStorage } from '../shared/mmkvStorageAdapter'
import { REOWN_PROJECT_ID } from '../shared/projectId'
import { SAFE_WALLET_METADATA } from '../shared/metadata'

const WALLET_MMKV_ID = 'walletkit'

let walletKit: IWalletKit | null = null
let initPromise: Promise<IWalletKit> | null = null

export const getWalletKit = (): Promise<IWalletKit> => {
  if (walletKit) return Promise.resolve(walletKit)
  if (initPromise) return initPromise

  initPromise = (async () => {
    const core = new Core({
      projectId: REOWN_PROJECT_ID,
      storage: createMmkvStorage(WALLET_MMKV_ID),
    })
    const instance = await WalletKit.init({
      core,
      metadata: SAFE_WALLET_METADATA,
    })
    walletKit = instance
    return instance
  })().catch((e) => {
    // Reset so a subsequent call can retry instead of staying stuck on a permanent rejection.
    initPromise = null
    throw e
  })

  return initPromise
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

Expected: PASS. If `IWalletKit` is not exported from `@reown/walletkit`, replace with the type the package exports (e.g. `WalletKitTypes['Wallet']` or `Awaited<ReturnType<typeof WalletKit.init>>` as a fallback).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/walletKit.ts
git commit -m "feat(mobile): add WalletKit singleton on walletkit MMKV id"
```

---

### Task 1.2: `walletKitSlice` — Redux state for sessions + pendingRequests

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/store/walletKitSlice.ts`
- Modify: `apps/mobile/src/store/index.ts` (register reducer)

- [ ] **Step 1: Write the slice**

```ts
import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import type { RootState } from '@/src/store'

export type PendingSessionProposal = {
  kind: 'proposal'
  id: number
  proposal: WalletKitTypes.SessionProposal
}

export type PendingSessionRequest = {
  kind: 'request'
  id: number
  topic: string
  chainId: string // CAIP-2, e.g. 'eip155:1'
  method: string
  params: unknown
}

export type PendingItem = PendingSessionProposal | PendingSessionRequest

// Tx requests we've handed off to the review-and-confirm flow. Keyed by safeTxHash.
// We respond to the dApp only after the propose mutation fulfils (i.e. the user has actually signed
// and CGW accepted), not when the dApp request sheet's Sign button is tapped.
export type OutstandingTxRequest = {
  topic: string
  id: number
  method: 'eth_sendTransaction' | 'wallet_sendCalls'
}

type State = {
  sessions: Record<string, SessionTypes.Struct> // keyed by topic
  pending: PendingItem[]
  outstandingRequests: Record<string, OutstandingTxRequest> // keyed by safeTxHash
}

const initialState: State = {
  sessions: {},
  pending: [],
  outstandingRequests: {},
}

const sliceName = 'walletKit' as const

const walletKitSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setSessions(state, action: PayloadAction<Record<string, SessionTypes.Struct>>) {
      state.sessions = action.payload
    },
    addSession(state, action: PayloadAction<SessionTypes.Struct>) {
      state.sessions[action.payload.topic] = action.payload
    },
    removeSession(state, action: PayloadAction<string>) {
      delete state.sessions[action.payload]
    },
    setPending(state, action: PayloadAction<PendingItem[]>) {
      state.pending = action.payload
    },
    pushPending(state, action: PayloadAction<PendingItem>) {
      const exists = state.pending.some((p) => p.id === action.payload.id && p.kind === action.payload.kind)
      if (!exists) state.pending.push(action.payload)
    },
    removePending(state, action: PayloadAction<{ id: number; kind: PendingItem['kind'] }>) {
      state.pending = state.pending.filter((p) => !(p.id === action.payload.id && p.kind === action.payload.kind))
    },
    setOutstandingRequest(state, action: PayloadAction<{ safeTxHash: string } & OutstandingTxRequest>) {
      const { safeTxHash, ...req } = action.payload
      state.outstandingRequests[safeTxHash] = req
    },
    clearOutstandingRequest(state, action: PayloadAction<string>) {
      delete state.outstandingRequests[action.payload]
    },
    clear() {
      return initialState
    },
  },
})

export const {
  setSessions,
  addSession,
  removeSession,
  setPending,
  pushPending,
  removePending,
  setOutstandingRequest,
  clearOutstandingRequest,
  clear: clearWalletKitState,
} = walletKitSlice.actions

export const selectSessionsRecord = (state: RootState) => state[sliceName].sessions
export const selectSessions = createSelector(selectSessionsRecord, (s) => Object.values(s))
export const selectSessionCount = createSelector(selectSessions, (s) => s.length)
export const selectPending = (state: RootState) => state[sliceName].pending
export const selectCurrentRequest = createSelector(selectPending, (p) => p[0] ?? null)
export const selectOutstandingRequests = (state: RootState) => state[sliceName].outstandingRequests
export const selectOutstandingRequestByHash = (state: RootState, safeTxHash: string) =>
  state[sliceName].outstandingRequests[safeTxHash]

export default walletKitSlice.reducer
export const walletKitSliceName = sliceName
```

- [ ] **Step 2: Register the reducer + ensure listener middleware exists**

Open `apps/mobile/src/store/index.ts`. Find the `combineReducers` (or `rootReducer`) call and add:

```ts
import walletKitReducer, { walletKitSliceName } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
```

In the reducers object:

```ts
[walletKitSliceName]: walletKitReducer,
```

Confirm this slice is NOT added to redux-persist's whitelist. If a persist config exists with a `whitelist` array, do nothing. If it uses `blacklist`, explicitly add `walletKitSliceName` to it.

**Listener middleware:** The WalletKitProvider in Task 5.1 will subscribe via `addListener` to react to RTK Query mutation success. Search the store file for `listenerMiddleware` or `createListenerMiddleware`. If not present, add it:

```ts
import { createListenerMiddleware } from '@reduxjs/toolkit'

export const listenerMiddleware = createListenerMiddleware()

// In the makeStore middleware config:
middleware: (getDefault) =>
  getDefault().prepend(listenerMiddleware.middleware).concat(/* …existing RTK Query middlewares… */),
```

Export the typed `addAppListener` action and `AppStartListening` type:

```ts
import { addListener, type TypedStartListening, type TypedAddListener } from '@reduxjs/toolkit'
export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export const startAppListening = listenerMiddleware.startListening as AppStartListening
export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>
```

If `listenerMiddleware` is already wired in the existing store, just re-export `addAppListener` from the same module so Task 5.1 can import it.

**Serializable check:** WalletKit's `SessionTypes.Struct` and `SessionProposal` contain nested objects (`verifyContext`, `relays`, `sessionProperties`, etc.) that may trip RTK's default serializable-check middleware. After registering the reducer, run the app once with the store active and watch for `serializableCheck` warnings. If they appear for `walletKit/*` actions, extend the middleware config:

```ts
middleware: (getDefault) =>
  getDefault({
    serializableCheck: {
      ignoredActions: [
        'walletKit/setSessions',
        'walletKit/addSession',
        'walletKit/setPending',
        'walletKit/pushPending',
      ],
      ignoredPaths: ['walletKit.sessions', 'walletKit.pending'],
    },
  }).prepend(listenerMiddleware.middleware).concat(/* …existing… */),
```

- [ ] **Step 3: Verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint apps/mobile/src/features/WalletConnect/Wallet apps/mobile/src/store/index.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/store/walletKitSlice.ts apps/mobile/src/store/index.ts
git commit -m "feat(mobile): add walletKitSlice for sessions, pending requests, outstanding tx replies"
```

---

### Task 1.3: `Wallet/utils/verifyStatus.ts` — verify result → UI variant

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/utils/verifyStatus.ts`

- [ ] **Step 1: Write the mapping**

```ts
import type { Verify } from '@walletconnect/types'

export type VerifyVariant = 'verified' | 'unverified' | 'malicious'

export const verifyStatusToVariant = (verifyContext?: Verify.Context['verified']): VerifyVariant => {
  if (!verifyContext) return 'unverified'
  if (verifyContext.isScam) return 'malicious'
  if (verifyContext.validation === 'VALID') return 'verified'
  return 'unverified' // UNKNOWN or INVALID
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

If `Verify.Context['verified']` is not the right type path in the installed `@walletconnect/types`, replace with the actual type — common alternative: `verifyContext: { validation: 'VALID' | 'UNKNOWN' | 'INVALID'; isScam?: boolean } | undefined`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/utils/verifyStatus.ts
git commit -m "feat(mobile): add verifyStatus → UI variant mapping for WC proposals"
```

---

## Phase 2 — Services (constants, namespaces, RPC proxy, compose)

### Task 2.1: `services/constants.ts` — supported methods and allow-lists

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/services/constants.ts`

- [ ] **Step 1: Write the constants**

```ts
// EIP-1193 / WC namespace methods this wallet supports.
export const WALLET_SUPPORTED_METHODS = [
  'eth_accounts',
  'eth_chainId',
  'net_version',
  'eth_sendTransaction',
  'wallet_sendCalls',
  'wallet_switchEthereumChain',
  'wallet_getCapabilities',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
] as const

export type SupportedMethod = (typeof WALLET_SUPPORTED_METHODS)[number]

// Read-only methods proxied to the chain RPC (ethers JsonRpcProvider).
export const READ_ONLY_RPC_ALLOW_LIST = [
  'eth_blockNumber',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_feeHistory',
  'eth_maxPriorityFeePerGas',
] as const

// Methods explicitly rejected with UNSUPPORTED_METHOD (no UI).
export const REJECTED_SIGNING_METHODS = [
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'safe_setSettings',
] as const

export const EVENTS_TO_EMIT = ['chainChanged', 'accountsChanged'] as const

// WalletConnect namespaces this wallet supports.
export const SUPPORTED_NAMESPACE = 'eip155' as const
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/services/constants.ts
git commit -m "feat(mobile): add WalletConnect method allow-list constants"
```

---

### Task 2.2: `services/namespaces.ts` — buildApprovedNamespaces wrapper

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/services/namespaces.ts`

- [ ] **Step 1: Write the wrapper**

```ts
import { buildApprovedNamespaces } from '@walletconnect/utils'
import type { SessionTypes, ProposalTypes } from '@walletconnect/types'
import { getAddress } from 'ethers'
import { WALLET_SUPPORTED_METHODS, EVENTS_TO_EMIT, SUPPORTED_NAMESPACE } from './constants'

export type SupportedChain = {
  chainId: string // numeric string, e.g. '1', '137'
}

export type BuildNamespacesInput = {
  proposal: ProposalTypes.Struct
  safeAddress: string
  supportedChains: SupportedChain[] // chains the Safe is deployed on
}

/**
 * Wraps WalletConnect's buildApprovedNamespaces with:
 *  - EIP-55 checksummed accounts
 *  - Hard-coded supported methods/events
 *  - eip155 namespace only
 */
export const buildSafeApprovedNamespaces = ({
  proposal,
  safeAddress,
  supportedChains,
}: BuildNamespacesInput): SessionTypes.Namespaces => {
  const checksummed = getAddress(safeAddress)
  const caip2Chains = supportedChains.map((c) => `${SUPPORTED_NAMESPACE}:${c.chainId}`)
  const accounts = caip2Chains.map((c) => `${c}:${checksummed}`)

  return buildApprovedNamespaces({
    proposal,
    supportedNamespaces: {
      [SUPPORTED_NAMESPACE]: {
        chains: caip2Chains,
        methods: [...WALLET_SUPPORTED_METHODS],
        events: [...EVENTS_TO_EMIT],
        accounts,
      },
    },
  })
}

/**
 * Build the sessionProperties hint passed to approveSession. Mirrors the web wallet's
 * shape (apps/web/.../WalletConnectContext/index.tsx) so dApps can detect atomic-batch
 * support without calling wallet_getCapabilities first.
 *
 * ProposalTypes.SessionProperties is `Record<string, string>` — values MUST be strings,
 * so the capability map is JSON-stringified.
 */
export const buildSafeSessionProperties = ({
  safeAddress,
  supportedChains,
}: {
  safeAddress: string
  supportedChains: SupportedChain[]
}): ProposalTypes.SessionProperties => {
  const checksummed = getAddress(safeAddress)
  const capabilities: Record<string, Record<string, { atomicBatch: { supported: true } }>> = {
    [checksummed]: {},
  }
  for (const c of supportedChains) {
    const chainIdHex = '0x' + Number(c.chainId).toString(16)
    capabilities[checksummed][chainIdHex] = { atomicBatch: { supported: true } }
  }
  return {
    atomic: JSON.stringify({ status: 'supported' }),
    capabilities: JSON.stringify(capabilities),
  }
}

export const isProposalSupported = (proposal: ProposalTypes.Struct): boolean => {
  const required = proposal.requiredNamespaces
  for (const key of Object.keys(required)) {
    if (!key.startsWith(SUPPORTED_NAMESPACE)) return false
  }
  return true
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/services/namespaces.ts
git commit -m "feat(mobile): add EIP-55-aware buildApprovedNamespaces wrapper"
```

---

### Task 2.3: `services/readRpcProxy.ts` — ethers v6 JSON-RPC passthrough

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/services/readRpcProxy.ts`

- [ ] **Step 1: Write the proxy**

```ts
import { JsonRpcProvider } from 'ethers'
import { READ_ONLY_RPC_ALLOW_LIST } from './constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const providerCache = new Map<string, JsonRpcProvider>()

const getProviderForChain = (chain: Chain): JsonRpcProvider => {
  const cached = providerCache.get(chain.chainId)
  if (cached) return cached
  const rpcUrl = chain.rpcUri?.value
  if (!rpcUrl) throw new Error(`No RPC URL configured for chainId=${chain.chainId}`)
  const provider = new JsonRpcProvider(rpcUrl, Number(chain.chainId))
  providerCache.set(chain.chainId, provider)
  return provider
}

export const isReadOnlyMethod = (method: string): boolean =>
  (READ_ONLY_RPC_ALLOW_LIST as readonly string[]).includes(method)

export const proxyReadOnlyCall = async (chain: Chain, method: string, params: unknown[]): Promise<unknown> => {
  if (!isReadOnlyMethod(method)) {
    throw new Error(`Method ${method} is not in the read-only allow-list`)
  }
  const provider = getProviderForChain(chain)
  return provider.send(method, params ?? [])
}
```

If your repo uses a different RPC URL accessor on `Chain` (e.g. `rpcUri.value` vs. `publicRpcUri.value`), prefer the public one and fall back to `rpcUri`.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/services/readRpcProxy.ts
git commit -m "feat(mobile): add read-only JSON-RPC proxy via ethers JsonRpcProvider"
```

---

### Task 2.4: `services/composeSafeTxDraft.ts` — `{to,value,data}` → DraftTx

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/services/composeSafeTxDraft.ts`

This is the spec's centrepiece. Modelled on `apps/mobile/src/features/Send/services/prepareSendDraft.ts`.

- [ ] **Step 1: Write the composer**

```ts
import type { AppDispatch } from '@/src/store'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { MetaTransactionData, SafeTransactionDataPartial } from '@safe-global/types-kit'
import { setDraft } from '@/src/store/draftTxSlice'
import { synthesizeDraftTxDetails } from '@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails'
import { transactionsPreviewTransactionV1 } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getSafeSDK } from '@/src/services/safe/getSafeSDK' // existing helper; verify path
import { OperationType } from '@safe-global/types-kit'

export type DappCall = {
  to: string
  value?: string // hex or decimal string
  data?: string
}

export type ComposeSafeTxDraftInput = {
  calls: DappCall[] // single for eth_sendTransaction, batch for wallet_sendCalls
  chainId: string
  safeAddress: string
  safe: SafeState
  dispatch: AppDispatch
}

const toMetaTx = (call: DappCall): MetaTransactionData => ({
  to: call.to,
  value: call.value ?? '0',
  data: call.data ?? '0x',
  operation: OperationType.Call,
})

export const composeSafeTxDraft = async ({
  calls,
  chainId,
  safeAddress,
  safe,
  dispatch,
}: ComposeSafeTxDraftInput): Promise<string> => {
  if (calls.length === 0) throw new Error('composeSafeTxDraft: empty calls array')

  const sdk = await getSafeSDK({ chainId, safeAddress })
  const metaTxs = calls.map(toMetaTx)

  // Single tx via createTx; batch (>1) becomes a Safe multiSend (operation=DelegateCall).
  const safeTx = await sdk.createTransaction({ transactions: metaTxs })
  const safeTxHash = await sdk.getTransactionHash(safeTx)

  const buildParams: SafeTransactionDataPartial = safeTx.data

  const previewArg = {
    chainId,
    safeAddress,
    previewTransactionDto: {
      to: buildParams.to,
      data: buildParams.data ?? '0x',
      value: buildParams.value ?? '0',
      operation: buildParams.operation ?? OperationType.Call,
    },
  }
  const previewResult = await dispatch(transactionsPreviewTransactionV1.initiate(previewArg)).unwrap()

  const txDetails = synthesizeDraftTxDetails({
    safeAddress,
    safeTxHash,
    buildParams,
    owners: safe.owners,
    threshold: safe.threshold,
    preview: previewResult,
  })

  dispatch(
    setDraft({
      chainId,
      safeAddress,
      buildParams,
      safeTxHash,
      txDetails,
    }),
  )

  return safeTxHash
}
```

Cross-check the exact import paths before committing:

- `getSafeSDK` — the helper used by `prepareSendDraft.ts`. Match whatever it imports.
- `transactionsPreviewTransactionV1` — confirm the export path; it is auto-generated under `@safe-global/store/gateway/AUTO_GENERATED/transactions`.
- `OperationType`, `MetaTransactionData`, `SafeTransactionDataPartial` — confirm from `@safe-global/types-kit`.
- `synthesizeDraftTxDetails` — confirm `owners` and `threshold` keys match what the function expects (per the prior research: yes).

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

If a path differs, fix the import and re-run. Do not paper over with `any`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/services/composeSafeTxDraft.ts
git commit -m "feat(mobile): add composeSafeTxDraft for dApp eth_sendTransaction/wallet_sendCalls"
```

---

### Task 2.5: `services/methodRouter.ts` — dispatch session_request by method

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/services/methodRouter.ts`

- [ ] **Step 1: Write the router**

```ts
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import type { WalletKitTypes } from '@reown/walletkit'
import type { AppDispatch, RootState } from '@/src/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { proxyReadOnlyCall, isReadOnlyMethod } from './readRpcProxy'
import { REJECTED_SIGNING_METHODS, SUPPORTED_NAMESPACE } from './constants'

export type RoutedResponse = ReturnType<typeof formatJsonRpcResult> | ReturnType<typeof formatJsonRpcError>

export type RouteContext = {
  request: WalletKitTypes.SessionRequest
  dispatch: AppDispatch
  getState: () => RootState
  // Active context resolved by caller — null when the dApp's chainId is not the active chain
  // or when no Safe is selected. The router still answers read-only and chain/account queries.
  activeChain: Chain | null
  activeSafe: SafeState | null
  hasSigner: boolean
  // Switch active chain handler (returns when state is committed):
  switchActiveChainByCaip2: (caip2: string) => Promise<{ ok: true } | { ok: false; reason: 'NOT_DEPLOYED' }>
  // Local Safe-tx status lookup (chainId, txId/safeTxHash) → status string per EIP-5792
  getCallsStatus: (chainId: string, id: string) => Promise<{ status: number; receipts?: unknown[] }>
  navigateToCallsStatus: (chainId: string, id: string) => void
}

const NS = SUPPORTED_NAMESPACE + ':'

const crossNamespaceError = (id: number) => formatJsonRpcError(id, getSdkError('UNAUTHORIZED_METHOD').message)

const unsupportedError = (id: number) => formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS').message)

export const routeSessionRequest = async (ctx: RouteContext): Promise<RoutedResponse> => {
  const { request, activeChain, activeSafe, hasSigner } = ctx
  const { id, params } = request
  const { request: rpc, chainId } = params
  const { method } = rpc
  const rpcParams = (rpc.params as unknown[]) ?? []

  if (!chainId.startsWith(NS)) return crossNamespaceError(id)

  // Methods we explicitly reject without UI.
  if ((REJECTED_SIGNING_METHODS as readonly string[]).includes(method)) {
    return unsupportedError(id)
  }

  // Local-answerable methods.
  if (method === 'eth_accounts') {
    return formatJsonRpcResult(id, activeSafe ? [activeSafe.address.value] : [])
  }
  if (method === 'eth_chainId') {
    const hex = activeChain ? '0x' + Number(activeChain.chainId).toString(16) : '0x0'
    return formatJsonRpcResult(id, hex)
  }
  if (method === 'net_version') {
    return formatJsonRpcResult(id, activeChain?.chainId ?? '0')
  }

  // Chain switch — target chain lives in rpc.params[0].chainId as a hex string
  // (EIP-3326). params.chainId on the WC envelope is the *current* session chain.
  if (method === 'wallet_switchEthereumChain') {
    const [target] = rpcParams as [{ chainId: string } | undefined]
    if (!target?.chainId) {
      return formatJsonRpcError(id, { code: -32602, message: 'Missing target chainId' })
    }
    const targetDecimal = String(parseInt(target.chainId, 16))
    const targetCaip2 = `${SUPPORTED_NAMESPACE}:${targetDecimal}`
    const result = await ctx.switchActiveChainByCaip2(targetCaip2)
    if (!result.ok) {
      return formatJsonRpcError(id, { code: 4901, message: 'Safe is not deployed on this chain' })
    }
    return formatJsonRpcResult(id, null)
  }

  // Capabilities (EIP-5792) — response is keyed by hex chain id, not CAIP-2.
  if (method === 'wallet_getCapabilities') {
    if (!activeChain) return formatJsonRpcResult(id, {})
    const cap = { atomicBatch: { supported: true } }
    const hexChain = '0x' + Number(activeChain.chainId).toString(16)
    return formatJsonRpcResult(id, { [hexChain]: cap })
  }

  // Calls status / show.
  if (method === 'wallet_getCallsStatus') {
    const [callsId] = rpcParams as [string]
    const status = await ctx.getCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, status)
  }
  if (method === 'wallet_showCallsStatus') {
    const [callsId] = rpcParams as [string]
    ctx.navigateToCallsStatus(chainId, callsId)
    return formatJsonRpcResult(id, null)
  }

  // Read-only RPC passthrough.
  if (isReadOnlyMethod(method)) {
    if (!activeChain) return formatJsonRpcError(id, { code: -32603, message: 'No active chain' })
    try {
      const result = await proxyReadOnlyCall(activeChain, method, rpcParams)
      return formatJsonRpcResult(id, result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'RPC proxy failed'
      return formatJsonRpcError(id, { code: -32603, message })
    }
  }

  // Transaction methods — handler will push the request to the slice so RequestSheetHost
  // renders the sheet. The sheet sends the response when the user signs or rejects.
  if (method === 'eth_sendTransaction' || method === 'wallet_sendCalls') {
    if (!activeSafe) {
      return formatJsonRpcError(id, { code: -32603, message: 'No active Safe' })
    }
    if (!hasSigner) {
      return formatJsonRpcError(id, { code: 4100, message: 'No signer attached to this Safe' })
    }
    // Sentinel: caller checks for this and DOES NOT call respondSessionRequest yet.
    return { id, jsonrpc: '2.0', result: '__DEFERRED__' } as unknown as RoutedResponse
  }

  return unsupportedError(id)
}

export const isDeferredResponse = (r: RoutedResponse): boolean => 'result' in r && r.result === '__DEFERRED__'
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

`@walletconnect/jsonrpc-utils` is a transitive dep of `@walletconnect/utils`. If TS can't resolve it, add it as a direct dep in `apps/mobile/package.json`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/services/methodRouter.ts
git commit -m "feat(mobile): add WalletConnect session_request method router"
```

---

## Phase 3 — Event hooks (proposal / request / delete / active-Safe binding)

### Task 3.1: `hooks/useSessionProposalHandler.ts`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionProposalHandler.ts`

- [ ] **Step 1: Write the handler**

```ts
import { useEffect } from 'react'
import { getSdkError } from '@walletconnect/utils'
import type { IWalletKit } from '@reown/walletkit'
import type { WalletKitTypes } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { useAppDispatch } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { pushPending } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainsSupportedBySafe } from '@/src/store/chains' // verify selector
import { isProposalSupported } from '../services/namespaces'
import { SUPPORTED_NAMESPACE } from '../services/constants'

export const useSessionProposalHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()

  useEffect(() => {
    if (!walletKit) return
    const onProposal = async (proposal: WalletKitTypes.SessionProposal) => {
      const state = store.getState()
      const activeSafe = selectActiveSafe(state)

      // Auto-reject (no UI) per spec when the proposal is fundamentally incompatible.
      if (!activeSafe) {
        await walletKit.rejectSession({ id: proposal.id, reason: getSdkError('USER_REJECTED') })
        return
      }
      if (!isProposalSupported(proposal.params)) {
        await walletKit.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_NAMESPACE_KEY'),
        })
        return
      }
      const supported = selectChainsSupportedBySafe(state)
      const supportedSet = new Set(supported.map((c) => `${SUPPORTED_NAMESPACE}:${c.chainId}`))
      const requiredChains = Object.values(proposal.params.requiredNamespaces).flatMap((ns) => ns.chains ?? [])
      const missing = requiredChains.find((c) => !supportedSet.has(c))
      if (missing) {
        await walletKit.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })
        return
      }

      dispatch(pushPending({ kind: 'proposal', id: proposal.id, proposal }))
    }
    walletKit.on('session_proposal', onProposal)
    return () => {
      walletKit.off('session_proposal', onProposal)
    }
  }, [walletKit, dispatch, store])
}

export const rejectProposal = async (walletKit: IWalletKit, id: number): Promise<void> => {
  await walletKit.rejectSession({ id, reason: getSdkError('USER_REJECTED') })
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionProposalHandler.ts
git commit -m "feat(mobile): subscribe to session_proposal and push to walletKitSlice"
```

---

### Task 3.2: `hooks/useSessionRequestHandler.ts`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionRequestHandler.ts`

- [ ] **Step 1: Write the handler**

```ts
import { useEffect, useCallback } from 'react'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { useStore } from 'react-redux'
import type { RootState, AppDispatch } from '@/src/store'
import { pushPending, removePending } from '../store/walletKitSlice'
import { routeSessionRequest, isDeferredResponse, type RouteContext } from '../services/methodRouter'
import { useSafeToast } from '@/src/components/Toast' // verify path (see Task 7.1)

export type SessionRequestHandlerDeps = Omit<RouteContext, 'request' | 'dispatch' | 'getState'>

// Spec: "auto-reject with formatJsonRpcError(id, { code: 4100, ... }) + generic toast".
const NO_SIGNER_ERROR_CODE = 4100

export const useSessionRequestHandler = (walletKit: IWalletKit | null, deps: SessionRequestHandlerDeps) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const toast = useSafeToast()

  const handleRequest = useCallback(
    async (request: WalletKitTypes.SessionRequest) => {
      if (!walletKit) return
      const ctx: RouteContext = {
        request,
        dispatch: dispatch as AppDispatch,
        getState: store.getState,
        ...deps,
      }
      const response = await routeSessionRequest(ctx)
      if (isDeferredResponse(response)) {
        // UI sheet will respond later. Push to pending so the host can render it.
        dispatch(
          pushPending({
            kind: 'request',
            id: request.id,
            topic: request.topic,
            chainId: request.params.chainId,
            method: request.params.request.method,
            params: request.params.request.params,
          }),
        )
        return
      }
      await walletKit.respondSessionRequest({ topic: request.topic, response })
      // Surface the spec-mandated toast on the no-signer auto-reject path.
      if ('error' in response && response.error?.code === NO_SIGNER_ERROR_CODE) {
        toast.show({ message: 'No signer attached to this Safe.', severity: 'error' })
      }
      // Ensure no stray pending entry for this id.
      dispatch(removePending({ id: request.id, kind: 'request' }))
    },
    [walletKit, dispatch, store, deps, toast],
  )

  useEffect(() => {
    if (!walletKit) return
    walletKit.on('session_request', handleRequest)
    return () => {
      walletKit.off('session_request', handleRequest)
    }
  }, [walletKit, handleRequest])
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionRequestHandler.ts
git commit -m "feat(mobile): wire session_request → methodRouter with deferred UI flow"
```

---

### Task 3.3: `hooks/useSessionDeleteHandler.ts` + lifecycle events

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionDeleteHandler.ts`

- [ ] **Step 1: Write the handler**

```ts
import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { removeSession, setSessions } from '../store/walletKitSlice'

export const useSessionDeleteHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!walletKit) return

    const refresh = () => {
      const active = walletKit.getActiveSessions()
      dispatch(setSessions(active))
    }

    const onDelete = ({ topic }: { topic: string }) => {
      dispatch(removeSession(topic))
    }
    const onExpire = ({ topic }: { topic: string }) => {
      dispatch(removeSession(topic))
    }

    walletKit.on('session_delete', onDelete)
    walletKit.on('session_expire', onExpire)
    walletKit.on('session_update', refresh)

    return () => {
      walletKit.off('session_delete', onDelete)
      walletKit.off('session_expire', onExpire)
      walletKit.off('session_update', refresh)
    }
  }, [walletKit, dispatch])
}
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/hooks/useSessionDeleteHandler.ts
git commit -m "feat(mobile): wire session_delete/expire/update to walletKitSlice"
```

---

### Task 3.4: `hooks/useActiveSafeBinding.ts` — push activeSafe changes to all sessions

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/hooks/useActiveSafeBinding.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { SUPPORTED_NAMESPACE } from '../services/constants'

const eip155Caip2 = (chainId: string) => `${SUPPORTED_NAMESPACE}:${chainId}`

export const useActiveSafeBinding = (walletKit: IWalletKit | null) => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const sessions = useAppSelector(selectSessions)

  useEffect(() => {
    if (!walletKit || !activeSafe) return
    const checksummed = getAddress(activeSafe.address)
    const chainCaip2 = eip155Caip2(activeSafe.chainId)
    const account = `${chainCaip2}:${checksummed}`

    sessions.forEach(async (session) => {
      try {
        const eip155 = session.namespaces[SUPPORTED_NAMESPACE]
        if (!eip155) return

        // 1) Update namespace accounts to the current active Safe address.
        const nextAccounts = eip155.chains?.map((c) => `${c}:${checksummed}`) ?? [account]
        await walletKit.updateSession({
          topic: session.topic,
          namespaces: {
            ...session.namespaces,
            [SUPPORTED_NAMESPACE]: { ...eip155, accounts: nextAccounts },
          },
        })

        // 2) Emit accountsChanged + chainChanged to the dApp.
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: { name: 'accountsChanged', data: [checksummed] },
          chainId: chainCaip2,
        })
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: { name: 'chainChanged', data: Number(activeSafe.chainId) },
          chainId: chainCaip2,
        })
      } catch (e) {
        console.log('[walletKit] active-safe binding failed for', session.topic, e)
      }
    })
  }, [walletKit, activeSafe?.address, activeSafe?.chainId, sessions])
}
```

Verify `selectActiveSafe` import path matches the repo (per research it lives in `apps/mobile/src/store/activeSafeSlice.ts`).

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/hooks/useActiveSafeBinding.ts
git commit -m "feat(mobile): bind active Safe address/chain into open WC sessions"
```

---

## Phase 4 — UI: permission panel, sheets, scanner

### Task 4.1: `components/ConnectionPermissionsPanel.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/ConnectionPermissionsPanel.tsx`

- [ ] **Step 1: Write the panel**

```tsx
import React from 'react'
import { Text, YStack, XStack } from 'tamagui'
import type { VerifyVariant } from '../utils/verifyStatus'

type Props = {
  variant: VerifyVariant
}

const COPY: Record<VerifyVariant, { title: string; tone: 'positive' | 'neutral' | 'critical' }> = {
  verified: { title: 'Verified dApp', tone: 'positive' },
  unverified: { title: 'Unverified dApp — proceed with caution', tone: 'neutral' },
  malicious: { title: 'This domain has been flagged as malicious', tone: 'critical' },
}

const PERMISSIONS = [
  'See your Safe address and balance',
  'Request approval for transactions',
  'Read on-chain data on your behalf',
]

export const ConnectionPermissionsPanel: React.FC<Props> = ({ variant }) => {
  const { title, tone } = COPY[variant]
  return (
    <YStack gap="$3" padding="$4" borderRadius="$3" backgroundColor="$backgroundSecondary">
      <Text
        fontWeight="600"
        color={tone === 'critical' ? '$error' : tone === 'positive' ? '$success' : '$colorSecondary'}
      >
        {title}
      </Text>
      <YStack gap="$2">
        {PERMISSIONS.map((p) => (
          <XStack key={p} gap="$2">
            <Text>•</Text>
            <Text>{p}</Text>
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}
```

Adjust Tamagui token names to whatever exists in the theme (`$success`, `$error` may be `$primary` / `$danger` etc.).

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/ConnectionPermissionsPanel.tsx
git commit -m "feat(mobile): add ConnectionPermissionsPanel for WC session proposal sheet"
```

---

### Task 4.2: `components/SessionProposalSheet.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/SessionProposalSheet.tsx`

- [ ] **Step 1: Write the sheet body**

```tsx
import React, { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { Image, Text, YStack, XStack, Button } from 'tamagui'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainsSupportedBySafe } from '@/src/store/chains' // verify selector name
import { addSession, removePending } from '../store/walletKitSlice'
import { buildSafeApprovedNamespaces, buildSafeSessionProperties } from '../services/namespaces'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { ConnectionPermissionsPanel } from './ConnectionPermissionsPanel'
import { rejectProposal } from '../hooks/useSessionProposalHandler'

type Props = {
  walletKit: IWalletKit
  pending: { id: number; proposal: WalletKitTypes.SessionProposal }
}

export const SessionProposalSheet: React.FC<Props> = ({ walletKit, pending }) => {
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  // chains the Safe is deployed on (numeric chainId strings):
  const supportedChains = useAppSelector(selectChainsSupportedBySafe)
  const [busy, setBusy] = useState(false)

  const { proposer, verifyContext } = pending.proposal.params
  const variant = useMemo(() => verifyStatusToVariant(verifyContext?.verified), [verifyContext])

  const close = () => dispatch(removePending({ id: pending.id, kind: 'proposal' }))

  const onConnect = async () => {
    // Defensive fallback only — the handler in Task 3.1 has already auto-rejected proposals
    // that are missing an active Safe or have unsupported namespaces. Reaching this branch
    // means the active Safe was cleared between handler-time and Connect-tap.
    if (!activeSafe) {
      await rejectProposal(walletKit, pending.id)
      close()
      return
    }
    try {
      setBusy(true)
      const namespaces = buildSafeApprovedNamespaces({
        proposal: pending.proposal.params,
        safeAddress: activeSafe.address,
        supportedChains,
      })
      // Signal atomic-batch support up front so dApps don't need to call
      // wallet_getCapabilities to discover it. Mirrors the web wallet's pattern.
      const sessionProperties = buildSafeSessionProperties({
        safeAddress: activeSafe.address,
        supportedChains,
      })
      const session = await walletKit.approveSession({
        id: pending.id,
        namespaces,
        sessionProperties,
      })
      dispatch(addSession(session))
      close()
    } catch (e) {
      Alert.alert('Failed to connect', e instanceof Error ? e.message : 'Unknown error')
      // Always reject on failure so the dApp doesn't hang waiting for a response.
      try {
        await rejectProposal(walletKit, pending.id)
      } catch (rejectErr) {
        console.log('[walletKit] rejectProposal after approve failure also failed', rejectErr)
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  const onReject = async () => {
    await rejectProposal(walletKit, pending.id)
    close()
  }

  const meta = proposer.metadata

  return (
    <YStack gap="$4" padding="$4">
      <XStack gap="$3" alignItems="center">
        {meta.icons?.[0] ? (
          <Image source={{ uri: meta.icons[0] }} width={48} height={48} borderRadius="$2" />
        ) : (
          <YStack width={48} height={48} borderRadius="$2" backgroundColor="$backgroundSecondary" />
        )}
        <YStack flex={1}>
          <Text fontWeight="600">{meta.name}</Text>
          <Text color="$colorSecondary" numberOfLines={1}>
            {meta.url}
          </Text>
        </YStack>
      </XStack>
      <ConnectionPermissionsPanel variant={variant} />
      <XStack gap="$3">
        <Button flex={1} variant="outlined" onPress={onReject} disabled={busy}>
          Reject
        </Button>
        <Button flex={1} onPress={onConnect} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </Button>
      </XStack>
    </YStack>
  )
}
```

Verify `selectChainsSupportedBySafe` exists — if not, derive in-place from the activeSafe's deployment list. The shape must yield `{ chainId: string }[]`.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/SessionProposalSheet.tsx
git commit -m "feat(mobile): add SessionProposalSheet for WC dApp pairing"
```

---

### Task 4.3: `components/SendTransactionSheet.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/SendTransactionSheet.tsx`

- [ ] **Step 1: Write the sheet**

```tsx
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { Text, YStack, XStack, Button } from 'tamagui'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectSafeState } from '@/src/store/safes' // verify — likely absent; if so use useSafesGetSafeV1Query (see Task 4.3 note) // verify selector name
import { removePending, setOutstandingRequest, clearOutstandingRequest } from '../store/walletKitSlice'
import { clearDraft } from '@/src/store/draftTxSlice'
import { composeSafeTxDraft, type DappCall } from '../services/composeSafeTxDraft'

type Props = {
  walletKit: IWalletKit
  pending: {
    id: number
    topic: string
    chainId: string
    method: 'eth_sendTransaction' | 'wallet_sendCalls' | string
    params: unknown
  }
}

const extractCalls = (method: string, params: unknown): DappCall[] => {
  if (method === 'eth_sendTransaction') {
    const [tx] = params as [DappCall]
    return [tx]
  }
  if (method === 'wallet_sendCalls') {
    const [batch] = params as [{ calls: DappCall[] }]
    return batch.calls
  }
  throw new Error(`Unsupported method in SendTransactionSheet: ${method}`)
}

export const SendTransactionSheet: React.FC<Props> = ({ walletKit, pending }) => {
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  const safe = useAppSelector(selectSafeState) // shape required by composeSafeTxDraft
  const [composing, setComposing] = useState(false)
  const [composedHash, setComposedHash] = useState<string | null>(null)
  // Becomes true when the user taps Sign and we hand the draft off to review-and-confirm.
  // The unmount cleanup uses this to decide whether to GC the draft.
  const handedOffRef = useRef(false)

  const calls = useMemo(() => {
    try {
      return extractCalls(pending.method, pending.params)
    } catch {
      return null
    }
  }, [pending.method, pending.params])

  // Declared BEFORE the compose effect so the catch handler can reference it without TDZ smell.
  const respondWithReject = async () => {
    await walletKit.respondSessionRequest({
      topic: pending.topic,
      response: formatJsonRpcError(pending.id, getSdkError('USER_REJECTED').message),
    })
    dispatch(removePending({ id: pending.id, kind: 'request' }))
    if (composedHash) {
      // Drop the draft so it doesn't linger in the queue UI.
      dispatch(clearDraft(composedHash))
    }
  }

  const onReject = async () => {
    if (composedHash) {
      // Make sure we don't leave a stale outstanding entry if the user reopens later.
      dispatch(clearOutstandingRequest(composedHash))
    }
    await respondWithReject()
  }

  // Compose draft on mount. Track the in-flight hash locally so the cleanup can GC orphans
  // when the effect is cancelled (re-render / unmount) after composeSafeTxDraft already
  // dispatched setDraft but before composedHash state caught up.
  useEffect(() => {
    if (!activeSafe || !calls) return
    let cancelled = false
    let inFlightHash: string | null = null
    setComposing(true)
    composeSafeTxDraft({
      calls,
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
      safe,
      dispatch,
    })
      .then((hash) => {
        inFlightHash = hash
        if (!cancelled) setComposedHash(hash)
      })
      .catch((e) => {
        if (!cancelled) {
          Alert.alert('Failed to build transaction', e instanceof Error ? e.message : 'Unknown error')
          void onReject()
        }
      })
      .finally(() => {
        if (!cancelled) setComposing(false)
      })
    return () => {
      cancelled = true
      // If the draft landed in the store but we never handed it off, GC it.
      if (inFlightHash && !handedOffRef.current) {
        dispatch(clearDraft(inFlightHash))
        dispatch(clearOutstandingRequest(inFlightHash))
      }
    }
  }, [activeSafe?.address, activeSafe?.chainId, calls, dispatch, safe])

  const onSign = async () => {
    if (!composedHash) return
    // Hand off to review-and-confirm. The dApp response is sent later by the propose-success
    // listener in WalletKitProvider, NOT here — the user hasn't actually signed yet.
    if (pending.method === 'eth_sendTransaction' || pending.method === 'wallet_sendCalls') {
      dispatch(
        setOutstandingRequest({
          safeTxHash: composedHash,
          topic: pending.topic,
          id: pending.id,
          method: pending.method,
        }),
      )
    }
    handedOffRef.current = true // tell the cleanup effect to leave the draft alone
    dispatch(removePending({ id: pending.id, kind: 'request' }))
    router.push({ pathname: '/review-and-confirm', params: { txId: composedHash } })
  }

  // Secondary GC for the path where composedHash was already in state at unmount — covers
  // explicit Reject (which sets composedHash before clearing) and dApp-side session_delete.
  useEffect(() => {
    return () => {
      if (composedHash && !handedOffRef.current) {
        dispatch(clearDraft(composedHash))
        dispatch(clearOutstandingRequest(composedHash))
      }
    }
  }, [composedHash, dispatch])

  if (!calls) {
    return (
      <YStack gap="$3" padding="$4">
        <Text>Invalid dApp request</Text>
        <Button onPress={onReject}>Close</Button>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" padding="$4">
      <Text fontWeight="600">dApp transaction</Text>
      <Text color="$colorSecondary">
        {calls.length} call{calls.length > 1 ? 's' : ''}
      </Text>
      <YStack gap="$2">
        {calls.map((c, i) => (
          <YStack key={i} gap="$1" padding="$2" borderRadius="$2" backgroundColor="$backgroundSecondary">
            <Text fontWeight="500">to: {c.to}</Text>
            <Text color="$colorSecondary">value: {c.value ?? '0'}</Text>
            <Text color="$colorSecondary" numberOfLines={1}>
              data: {c.data ?? '0x'}
            </Text>
          </YStack>
        ))}
      </YStack>
      <XStack gap="$3">
        <Button flex={1} variant="outlined" onPress={onReject} disabled={composing}>
          Reject
        </Button>
        <Button flex={1} onPress={onSign} disabled={composing || !composedHash}>
          {composing ? 'Preparing…' : 'Sign'}
        </Button>
      </XStack>
    </YStack>
  )
}
```

**`selectSafeState` may not exist as a single selector.** A quick `grep -rn "selectSafeState" apps/mobile/src` confirms this in seconds. If it's absent (likely), the SafeState lives in the RTK Query cache for `safesGetSafeV1`. Use the hook directly in the sheet:

```tsx
import { safesGetSafeV1, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

// inside the component:
const { data: safe } = useSafesGetSafeV1Query(
  activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
)
```

WalletKitProvider (Task 5.1) has the same dependency — same fix applies there.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/SendTransactionSheet.tsx
git commit -m "feat(mobile): add SendTransactionSheet routing to review-and-confirm via draft"
```

---

### Task 4.4: `components/RequestSheetHost.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/RequestSheetHost.tsx`

- [ ] **Step 1: Write the host**

```tsx
import React, { useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrentRequest } from '../store/walletKitSlice'
import { SessionProposalSheet } from './SessionProposalSheet'
import { SendTransactionSheet } from './SendTransactionSheet'

type Props = { walletKit: IWalletKit | null }

export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (current) ref.current?.present()
    else ref.current?.dismiss()
  }, [current])

  return (
    <BottomSheetModal ref={ref} snapPoints={['70%']} enableDynamicSizing={false}>
      {walletKit && current?.kind === 'proposal' && <SessionProposalSheet walletKit={walletKit} pending={current} />}
      {walletKit && current?.kind === 'request' && current.method === 'eth_sendTransaction' && (
        <SendTransactionSheet walletKit={walletKit} pending={current} />
      )}
      {walletKit && current?.kind === 'request' && current.method === 'wallet_sendCalls' && (
        <SendTransactionSheet walletKit={walletKit} pending={current} />
      )}
    </BottomSheetModal>
  )
}
```

Confirm the bottom-sheet API used in the repo — if the existing modal-strict pattern wraps `BottomSheetModal` in a project-specific component (e.g. `<SafeBottomSheet />`), use that instead.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/RequestSheetHost.tsx
git commit -m "feat(mobile): add RequestSheetHost switching between proposal/tx sheets"
```

---

### Task 4.5: `components/QrScannerSheet.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/QrScannerSheet.tsx`

- [ ] **Step 1: Write the scanner sheet**

```tsx
import React, { useState, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Text, YStack, Button } from 'tamagui'
import { QrCamera } from '@/src/components/Camera/QrCamera'
import { getWalletKit } from '../walletKit'

const isWcUri = (s: string) => s.startsWith('wc:')

const TIMEOUT_MS = 10_000

type Props = { open: boolean; onClose: () => void }

export const QrScannerSheet: React.FC<Props> = ({ open, onClose }) => {
  const ref = useRef<BottomSheetModal>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set true when the timeout fires; further state writes for this pair attempt are no-ops.
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (open) ref.current?.present()
    else ref.current?.dismiss()
  }, [open])

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Make sure a stale timer never fires after unmount.
  useEffect(() => () => clearTimer(), [])

  const startPair = async (uri: string) => {
    setConnecting(true)
    setError(null)
    cancelledRef.current = false
    timerRef.current = setTimeout(() => {
      cancelledRef.current = true
      timerRef.current = null
      setError('Connection timed out. Try again.')
      setConnecting(false)
    }, TIMEOUT_MS)
    try {
      const wk = await getWalletKit()
      await wk.pair({ uri })
      // Proposal will surface via the session_proposal subscription → RequestSheetHost.
      if (cancelledRef.current) return // timed out before we got here; leave the error visible
      clearTimer()
      setConnecting(false)
      onClose()
    } catch (e) {
      if (cancelledRef.current) return
      clearTimer()
      setConnecting(false)
      setError(e instanceof Error ? e.message : 'Failed to pair')
    }
  }

  const onScan = (codes: { value?: string }[]) => {
    const raw = codes[0]?.value
    if (!raw || !isWcUri(raw)) {
      // Ignore non-wc QRs silently — keep scanning.
      return
    }
    void startPair(raw)
  }

  const onRetry = () => {
    setError(null)
  }

  return (
    <BottomSheetModal ref={ref} snapPoints={['90%']} enableDynamicSizing={false} onDismiss={onClose}>
      <YStack flex={1} padding="$4" gap="$3">
        <Text fontWeight="600">Scan WalletConnect QR</Text>
        {!error && !connecting && <QrCamera onScan={onScan} />}
        {connecting && <Text>Connecting…</Text>}
        {error && (
          <YStack gap="$3" padding="$4" backgroundColor="$backgroundSecondary" borderRadius="$3">
            <Text color="$error">{error}</Text>
            <Button onPress={onRetry}>Try again</Button>
          </YStack>
        )}
      </YStack>
    </BottomSheetModal>
  )
}
```

Match the `QrCamera` import path and prop shape to whatever the repo exposes. From the prior research it lives at `apps/mobile/src/components/Camera/QrCamera.tsx`; double-check before committing.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/QrScannerSheet.tsx
git commit -m "feat(mobile): add single-tab QR scanner sheet for WalletConnect URIs"
```

---

### Task 4.6: `components/HeaderQrButton.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/HeaderQrButton.tsx`

- [ ] **Step 1: Write the header button**

```tsx
import React, { useState } from 'react'
import { Pressable } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon' // verify path
import { QrScannerSheet } from './QrScannerSheet'

export const HeaderQrButton: React.FC = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const [open, setOpen] = useState(false)

  if (!activeSafe) return null

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Scan WalletConnect QR"
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <SafeFontIcon name="qr-code" />
      </Pressable>
      <QrScannerSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

Use whichever icon exists in the project's icon set (`scan`, `qr-code`, etc.). Check `apps/mobile/src/components/SafeFontIcon/types.ts` for available names.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/HeaderQrButton.tsx
git commit -m "feat(mobile): add header QR button to open WC scanner"
```

---

### Task 4.7: Mount `HeaderQrButton` in the Assets Navbar

**Files:**

- Modify: `apps/mobile/src/features/Assets/components/Navbar/Navbar.tsx`

- [ ] **Step 1: Add the button**

In `Navbar.tsx`, the right-hand `<XStack>` currently contains `<PendingTxBadge />` and `<NetworkSelector />`. Insert `<HeaderQrButton />` between them (so the order is: PendingTxBadge → HeaderQrButton → NetworkSelector). Import:

```tsx
import { HeaderQrButton } from '@/src/features/WalletConnect/Wallet/components/HeaderQrButton'
```

Insertion (around lines 94-139 in the existing file):

```tsx
<XStack gap="$2" alignItems="center">
  <PendingTxBadge />
  <HeaderQrButton />
  <NetworkSelector />
</XStack>
```

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint apps/mobile/src/features/Assets/components/Navbar/Navbar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/Assets/components/Navbar/Navbar.tsx
git commit -m "feat(mobile): mount HeaderQrButton in Assets navbar"
```

---

## Phase 5 — WalletKitProvider + provider mounting

### Task 5.1: `context/WalletKitProvider.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/context/WalletKitProvider.tsx`

This composes the singleton, all four event hooks, the active-Safe binding, and mounts `RequestSheetHost`. It also seeds the slice on init.

- [ ] **Step 1: Write the provider**

```tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { router } from 'expo-router'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useStore } from 'react-redux'
import type { RootState } from '@/src/store'
import { startAppListening } from '@/src/store' // see Task 1.2 — listener middleware setup
import { getWalletKit } from '../walletKit'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../hooks/useSessionRequestHandler'
import { useSessionDeleteHandler } from '../hooks/useSessionDeleteHandler'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import {
  setSessions,
  pushPending,
  clearOutstandingRequest,
  selectOutstandingRequestByHash,
} from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectChainsSupportedBySafe } from '@/src/store/chains' // verify selector name
import { selectSafeState } from '@/src/store/safes' // verify — likely absent; if so use useSafesGetSafeV1Query (see Task 4.3 note)
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { switchActiveChain } from '@/src/store/activeSafeSlice' // verify name
import {
  transactionsGetTransactionByIdV1,
  transactionsProposeTransactionV1,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const WalletKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [walletKit, setWalletKit] = useState<IWalletKit | null>(null)

  // Init + seed.
  useEffect(() => {
    let mounted = true
    getWalletKit()
      .then((wk) => {
        if (!mounted) return
        setWalletKit(wk)
        // Seed sessions.
        dispatch(setSessions(wk.getActiveSessions()))
        // Seed pending requests — only those the user can act on (tx flows). Anything else
        // (read-only RPC etc.) will be retried by the dApp on next session activity, so
        // don't surface stale entries in the slice that the sheet host can't render.
        const DEFERRED_METHODS = new Set(['eth_sendTransaction', 'wallet_sendCalls'])
        const pendings = wk.getPendingSessionRequests()
        ;(pendings as WalletKitTypes.SessionRequest[]).forEach((r) => {
          if (!DEFERRED_METHODS.has(r.params.request.method)) return
          dispatch(
            pushPending({
              kind: 'request',
              id: r.id,
              topic: r.topic,
              chainId: r.params.chainId,
              method: r.params.request.method,
              params: r.params.request.params,
            }),
          )
        })
      })
      .catch((e) => console.log('[walletKit] init failed', e))
    return () => {
      mounted = false
    }
  }, [dispatch])

  // Reject session_authenticate (out of scope).
  useEffect(() => {
    if (!walletKit) return
    const onAuth = async ({ id }: { id: number }) => {
      await walletKit.rejectSessionAuthenticate({
        id,
        reason: getSdkError('UNSUPPORTED_METHODS'),
      })
    }
    walletKit.on('session_authenticate', onAuth)
    return () => {
      walletKit.off('session_authenticate', onAuth)
    }
  }, [walletKit])

  // Respond to the dApp when the user has actually signed.
  // The existing review-and-confirm flow calls transactionsProposeTransactionV1 after signing;
  // we match its fulfilled action against any outstanding tx request keyed by safeTxHash.
  useEffect(() => {
    if (!walletKit) return
    const unsubscribe = startAppListening({
      matcher: transactionsProposeTransactionV1.matchFulfilled,
      effect: async (action, api) => {
        // The arg shape is { chainId, safeAddress, transactionV1Dto: { safeTxHash, ... } }.
        // Verify the field name matches the auto-generated type when implementing.
        const arg = action.meta.arg.originalArgs as {
          transactionV1Dto?: { safeTxHash?: string }
        }
        const safeTxHash = arg.transactionV1Dto?.safeTxHash
        if (!safeTxHash) return
        const outstanding = selectOutstandingRequestByHash(api.getState(), safeTxHash)
        if (!outstanding) return
        const result = outstanding.method === 'wallet_sendCalls' ? { id: safeTxHash } : safeTxHash
        try {
          await walletKit.respondSessionRequest({
            topic: outstanding.topic,
            response: formatJsonRpcResult(outstanding.id, result),
          })
        } catch (e) {
          console.log('[walletKit] respondSessionRequest after propose failed', e)
        }
        api.dispatch(clearOutstandingRequest(safeTxHash))
      },
    })
    return () => {
      unsubscribe()
    }
  }, [walletKit])

  // Build router deps.
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeChain = useAppSelector((s) => (activeSafe ? selectChainById(s, activeSafe.chainId) : null))
  const safe = useAppSelector(selectSafeState)
  const activeSigner = useAppSelector((s) => (activeSafe ? selectActiveSigner(s, activeSafe.address) : undefined))

  const switchActiveChainByCaip2: SessionRequestHandlerDeps['switchActiveChainByCaip2'] = useCallback(
    async (caip2) => {
      const [, chainId] = caip2.split(':')
      const state = store.getState()
      const chain = selectChainById(state, chainId)
      if (!chain) return { ok: false, reason: 'NOT_DEPLOYED' }
      // Only allow chains the Safe is deployed on. Reuse the same selector the proposal
      // handler uses for consistency — the answer must agree across surfaces.
      const supported = selectChainsSupportedBySafe(state)
      const isDeployed = supported.some((c) => c.chainId === chainId)
      if (!isDeployed) return { ok: false, reason: 'NOT_DEPLOYED' }
      dispatch(switchActiveChain({ chainId }))
      return { ok: true }
    },
    [store, dispatch],
  )

  const getCallsStatus: SessionRequestHandlerDeps['getCallsStatus'] = useCallback(
    async (chainId, id) => {
      // EIP-5792 status mapping for a Safe tx hash:
      //   100 = PENDING (not yet executed on-chain or awaiting confirmations)
      //   200 = CONFIRMED (executed and mined)
      //   400 = REVERTED / CANCELLED
      try {
        const tx = await dispatch(transactionsGetTransactionByIdV1.initiate({ chainId, id })).unwrap()
        const status =
          tx.txStatus === 'SUCCESS' ? 200 : tx.txStatus === 'FAILED' || tx.txStatus === 'CANCELLED' ? 400 : 100
        return { status }
      } catch {
        // Not yet known to CGW → still pending locally.
        return { status: 100 }
      }
    },
    [dispatch],
  )

  const navigateToCallsStatus: SessionRequestHandlerDeps['navigateToCallsStatus'] = useCallback((chainId, id) => {
    router.push({ pathname: '/pending-transactions', params: { chainId, txId: id } })
  }, [])

  const deps: SessionRequestHandlerDeps = useMemo(
    () => ({
      activeChain: activeChain ?? null,
      activeSafe: safe ?? null,
      hasSigner: !!activeSigner,
      switchActiveChainByCaip2,
      getCallsStatus,
      navigateToCallsStatus,
    }),
    [activeChain, safe, activeSigner, switchActiveChainByCaip2, getCallsStatus, navigateToCallsStatus],
  )

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit, deps)
  useSessionDeleteHandler(walletKit)
  useActiveSafeBinding(walletKit)

  return (
    <>
      {children}
      <RequestSheetHost walletKit={walletKit} />
    </>
  )
}
```

`getCallsStatus` queries CGW for the Safe tx by `safeTxHash` and maps the CGW `txStatus` to EIP-5792 codes (100 / 200 / 400). A miss is treated as PENDING (100). If real dApps surface unexpected status text during smoke test #4, refine the mapping in a follow-up.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint apps/mobile/src/features/WalletConnect/Wallet
```

Fix any selector-name mismatches surfaced by type-check.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/context/WalletKitProvider.tsx
git commit -m "feat(mobile): add WalletKitProvider wiring singleton + event hooks + sheet host"
```

---

### Task 5.2: Mount `WalletKitProvider` in `_layout.tsx`

**Files:**

- Modify: `apps/mobile/src/app/_layout.tsx`

The spec calls for `WalletKitProvider` to mount as a sibling to `AppKitInitializer` so its sheets are outside the iOS `FullWindowOverlay`.

- [ ] **Step 1: Add the provider**

Open `_layout.tsx`, find the line where `AppKitInitializer` wraps its children. Wrap `AppKitInitializer`'s children with `WalletKitProvider` (so WalletKit sheets render _outside_ the AppKit overlay but inside the rest of the provider tree).

Import at top:

```tsx
import { WalletKitProvider } from '@/src/features/WalletConnect/Wallet/context/WalletKitProvider'
```

Modify the nesting:

```tsx
<AppKitInitializer>
  <WalletKitProvider>
    <SafeThemeProvider>{/* …existing children… */}</SafeThemeProvider>
  </WalletKitProvider>
</AppKitInitializer>
```

Rationale: `AppKitInitializer` mounts the iOS `FullWindowOverlay` _only_ around `<AppKit />`, not around its `children` prop. So `WalletKitProvider` inside `children` is naturally outside the overlay. Verify this by inspecting `AppKitInitializer.tsx` — it should pass `{children}` through without wrapping in the overlay.

- [ ] **Step 2: Verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint apps/mobile/src/app/_layout.tsx
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): mount WalletKitProvider in app layout"
```

---

## Phase 6 — Deep links (`wc://`)

### Task 6.1: Android `wc://` intent filter

**Files:**

- Modify: `apps/mobile/android/app/src/main/AndroidManifest.xml` (or `apps/mobile/app.config.ts` if managed)

- [ ] **Step 1: Pre-flight — check for existing `wc` scheme registration**

AppKit (Signer side) or another dep may already claim `wc://`. Adding a second filter on the same scheme makes Android show a disambiguation chooser, which breaks acceptance #2 (deep-link pairing without UI friction).

```bash
grep -rn 'scheme.*"wc"\|"wc"[^a-z]\|"scheme": "wc"' apps/mobile/android apps/mobile/app.config.ts apps/mobile/app.json 2>/dev/null
grep -rn 'android:scheme="wc"' apps/mobile/android 2>/dev/null
```

**Decision point based on what you find:**

| Result                                                                                                                           | Action                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No existing `wc` scheme                                                                                                          | Proceed to Step 2                                                                                                                                                                            |
| AppKit already registered `wc` via its own native code (look in `node_modules/@reown/*` Android manifests merged into the build) | STOP adding the filter. Skip to Step 5 with deep links disabled. File a follow-up: introduce a Safe-specific scheme (e.g. `safe-wc://`) and have the in-app QR scanner rewrite incoming URIs |
| Project already added `wc` for the Signer's WC URI scanner                                                                       | STOP — the scheme is shared; just verify the handler is the WalletKit `pair()` path, not the Signer's, when both SDKs are init'd                                                             |

Only proceed to Step 2 if the pre-flight is clean.

- [ ] **Step 2: Determine manifest location**

```bash
ls apps/mobile/android/app/src/main/AndroidManifest.xml 2>/dev/null && echo "native manifest" || echo "managed"
cat apps/mobile/app.config.ts 2>/dev/null | head -60
```

If the project uses an Expo config plugin (most likely), edit `app.config.ts`. If native, edit `AndroidManifest.xml` directly.

- [ ] **Step 3: Add the intent filter (config plugin form)**

If `app.config.ts` already has an `android.intentFilters` array, add an entry:

```ts
intentFilters: [
  // …existing filters…
  {
    action: 'VIEW',
    autoVerify: false,
    data: [{ scheme: 'wc' }],
    category: ['BROWSABLE', 'DEFAULT'],
  },
],
```

Or in native `AndroidManifest.xml`, inside the main `<activity>`:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="wc" />
</intent-filter>
```

- [ ] **Step 4: iOS URL scheme**

iOS allows multiple registrants for the same scheme (no chooser; the foreground app receives the URL), so the same pre-flight concern doesn't apply here — register unconditionally. Check `ios/<App>/Info.plist` (or `app.config.ts` ios.infoPlist) for an existing `wc` URL scheme. If absent, add:

```ts
ios: {
  // …existing config…
  infoPlist: {
    CFBundleURLTypes: [
      // …existing entries…
      { CFBundleURLSchemes: ['wc'] },
    ],
  },
},
```

- [ ] **Step 5: Rebuild native**

```bash
yarn workspace @safe-global/mobile expo prebuild --clean
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app.config.ts apps/mobile/android apps/mobile/ios
git commit -m "feat(mobile): register wc:// deep-link scheme for WalletConnect pairing"
```

---

### Task 6.2: Deep-link listener wires into `pair()`

**Files:**

- Modify: `apps/mobile/src/features/WalletConnect/Wallet/context/WalletKitProvider.tsx`

- [ ] **Step 1: Add the import to the top of `WalletKitProvider.tsx`**

Add alongside the existing imports (not inside the component):

```tsx
import * as Linking from 'expo-linking'
```

- [ ] **Step 2: Add the listener `useEffect` inside `WalletKitProvider`**

Place it after the `session_authenticate` rejection effect, so the listener subscriptions are co-located:

```tsx
useEffect(() => {
  if (!walletKit) return
  const handleUrl = async (url: string) => {
    if (!url.startsWith('wc:')) return
    try {
      await walletKit.pair({ uri: url })
    } catch (e) {
      console.log('[walletKit] deep-link pair failed', e)
    }
  }
  const sub = Linking.addEventListener('url', ({ url }) => {
    void handleUrl(url)
  })
  // Cold-start case:
  Linking.getInitialURL().then((url) => {
    if (url) void handleUrl(url)
  })
  return () => {
    sub.remove()
  }
}, [walletKit])
```

- [ ] **Step 3: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/context/WalletKitProvider.tsx
git commit -m "feat(mobile): wire wc:// deep links into WalletKit.pair()"
```

---

## Phase 7 — Connected dApps screen + settings entry

### Task 7.1: `components/ConnectedDappsScreen.tsx`

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/ConnectedDappsScreen.tsx`
- Create: `apps/mobile/src/app/connected-apps.tsx` (Expo Router screen)

- [ ] **Step 1: Write the screen body**

```tsx
import React, { useState } from 'react'
import { Alert, FlatList } from 'react-native'
import { Image, Text, XStack, YStack, Pressable } from 'tamagui'
import { getSdkError } from '@walletconnect/utils'
import type { SessionTypes } from '@walletconnect/types'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectSessions, removeSession } from '../store/walletKitSlice'
import { getWalletKit } from '../walletKit'
// Use whatever toast API the project already exposes (likely from SafeToastProvider).
// Common shapes: useToast() returning { show }, or a static SafeToast.show(...).
// Verify the import + call style by looking at an existing call site (e.g. settings or send flow).
import { useSafeToast } from '@/src/components/Toast' // verify path

export const ConnectedDappsScreen: React.FC = () => {
  const sessions = useAppSelector(selectSessions)
  const dispatch = useAppDispatch()
  const toast = useSafeToast()
  const [busyTopic, setBusyTopic] = useState<string | null>(null)

  const onDisconnect = (session: SessionTypes.Struct) => {
    // Confirm modal stays as Alert.alert — spec says "plain confirm modal".
    Alert.alert('Disconnect dApp?', `Disconnect from ${session.peer.metadata.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setBusyTopic(session.topic)
          try {
            const wk = await getWalletKit()
            await wk.disconnectSession({
              topic: session.topic,
              reason: getSdkError('USER_DISCONNECTED'),
            })
            dispatch(removeSession(session.topic))
            // Success → toast per spec. Alert is wrong here.
            toast.show({ message: `${session.peer.metadata.name} disconnected.`, severity: 'success' })
          } catch (e) {
            toast.show({
              message: e instanceof Error ? e.message : 'Failed to disconnect',
              severity: 'error',
            })
          } finally {
            setBusyTopic(null)
          }
        },
      },
    ])
  }

  return (
    <YStack flex={1} padding="$4">
      <Text fontWeight="600" marginBottom="$3">
        Connected apps
      </Text>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.topic}
        renderItem={({ item }) => {
          const meta = item.peer.metadata
          return (
            <Pressable onPress={() => onDisconnect(item)} disabled={busyTopic === item.topic}>
              <XStack gap="$3" padding="$3" alignItems="center">
                {meta.icons?.[0] ? (
                  <Image source={{ uri: meta.icons[0] }} width={32} height={32} borderRadius="$2" />
                ) : (
                  <YStack width={32} height={32} borderRadius="$2" backgroundColor="$backgroundSecondary" />
                )}
                <YStack flex={1}>
                  <Text fontWeight="500">{meta.name}</Text>
                  <Text color="$colorSecondary" numberOfLines={1}>
                    {meta.url}
                  </Text>
                </YStack>
              </XStack>
            </Pressable>
          )
        }}
        ListEmptyComponent={<Text color="$colorSecondary">No connected apps.</Text>}
      />
    </YStack>
  )
}
```

- [ ] **Step 2: Write the Expo Router screen**

`apps/mobile/src/app/connected-apps.tsx`:

```tsx
import React from 'react'
import { ConnectedDappsScreen } from '@/src/features/WalletConnect/Wallet/components/ConnectedDappsScreen'

export default ConnectedDappsScreen
```

- [ ] **Step 3: Verify**

```bash
yarn workspace @safe-global/mobile type-check
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/ConnectedDappsScreen.tsx apps/mobile/src/app/connected-apps.tsx
git commit -m "feat(mobile): add Connected apps screen with tap-to-disconnect"
```

---

### Task 7.2: `components/ConnectedDappsEntry.tsx` + settings mount

**Files:**

- Create: `apps/mobile/src/features/WalletConnect/Wallet/components/ConnectedDappsEntry.tsx`
- Modify: `apps/mobile/src/features/Settings/Settings.tsx`

- [ ] **Step 1: Write the settings entry**

```tsx
import React from 'react'
import { Pressable } from 'react-native'
import { router } from 'expo-router'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessionCount } from '../store/walletKitSlice'
import { SafeListItem } from '@/src/components/SafeListItem/SafeListItem' // verify path
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'

export const ConnectedDappsEntry: React.FC = () => {
  const count = useAppSelector(selectSessionCount)
  if (count === 0) return null
  return (
    <Pressable onPress={() => router.push('/connected-apps')}>
      <SafeListItem
        label="Connected apps"
        leftNode={<SafeFontIcon name="apps" />}
        rightNode={null}
        testID="settings-connected-apps-list-item"
      />
    </Pressable>
  )
}
```

Verify icon name in the existing icon enum.

- [ ] **Step 2: Mount in Settings.tsx**

In `apps/mobile/src/features/Settings/Settings.tsx`, find the "Members" section that contains the `<Pressable onPress={() => router.push('/signers')}>` block (lines 137–166 per research). Immediately _below_ that `<Pressable>` (still inside the same `<View>`), add:

```tsx
<ConnectedDappsEntry />
```

Import at top:

```tsx
import { ConnectedDappsEntry } from '@/src/features/WalletConnect/Wallet/components/ConnectedDappsEntry'
```

- [ ] **Step 3: Verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint apps/mobile/src/features/Settings/Settings.tsx
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/WalletConnect/Wallet/components/ConnectedDappsEntry.tsx apps/mobile/src/features/Settings/Settings.tsx
git commit -m "feat(mobile): show Connected apps entry in settings when sessions exist"
```

---

## Phase 8 — Final verification, smoke test, PR

### Task 8.1: Full project verification

- [ ] **Step 1: Run the full mobile verify**

```bash
yarn workspace @safe-global/mobile type-check
yarn workspace @safe-global/mobile lint
yarn workspace @safe-global/mobile prettier
yarn workspace @safe-global/mobile test
```

Expected: all PASS. The Jest test suite must remain green — existing tests should not regress.

If any step fails: fix and re-run before moving to smoke testing. Do NOT push with failures.

- [ ] **Step 2: Commit any prettier/lint fixups**

```bash
git status
# If anything changed:
git add -A
git commit -m "chore(mobile): prettier/lint fixups for WC dApp POC"
```

---

### Task 8.2: Manual smoke test (10 acceptance criteria)

**Setup:**

```bash
yarn workspace @safe-global/mobile start:ios   # or start:android
```

For each scenario below, capture: ✅ pass, ❌ fail (with notes). Use a real iPhone/Android device — simulator works for most flows but deep-link cold-start needs a device.

- [ ] **1. Pair via QR (Uniswap desktop):**
      Open https://app.uniswap.org, click "Connect" → WalletConnect → QR. Tap the QR button in the Safe mobile header. Scan. Proposal sheet opens with Uniswap logo/name. Tap Connect. Uniswap UI shows connected. ✅/❌

- [ ] **2. Pair via deep link:**
      From a desktop browser, paste a `wc://` URL into a note on the device and tap it (or use a mobile dApp's "Open wallet" flow). The Safe app foregrounds; proposal sheet opens directly. ✅/❌

- [ ] **3. Reject a session:**
      Repeat #1 but swipe the proposal sheet down. Uniswap sees the rejection. ✅/❌

- [ ] **4. Send a tx:**
      In a connected Uniswap session (desktop dApp), initiate a small swap. `SendTransactionSheet` opens with the decoded payload. Tap Sign. The app navigates to `review-and-confirm` showing the draft. **At this point Uniswap should still be in its "waiting for signature" state** — no `safeTxHash` yet. Complete the signing flow normally. The Safe tx appears in the local queue, and _now_ Uniswap advances past the waiting state and shows the `safeTxHash`. For a mobile-only dApp where no devtools are visible, observe the dApp UI state transition; for desktop dApps, the network panel is the easiest place to confirm timing. ✅/❌

- [ ] **5. Switch chain — supported:**
      In a Uniswap session on a chain the Safe is deployed on (e.g. Polygon if your Safe is multi-chain), trigger `wallet_switchEthereumChain` (Uniswap switches chains as you choose tokens). Active chain in the Safe app flips. ✅/❌

- [ ] **6. Switch chain — unsupported:**
      Trigger `wallet_switchEthereumChain` to a chain the Safe is NOT deployed on. dApp sees `4901` error. ✅/❌

- [ ] **7. Read-only call:**
      Verify a dApp can call `eth_call` (Uniswap reads token allowances during normal flow). It should return data — if Uniswap proceeds past balance loading, this works. ✅/❌

- [ ] **8. Read-only Safe rejection:**
      Switch to a Safe with no attached signer. Initiate a swap on Uniswap. Auto-reject toast appears immediately. Uniswap gets `4100`. ✅/❌

- [ ] **9. Sign request rejection:**
      Find a dApp that triggers `personal_sign` (e.g. login). Verify no UI opens in the Safe app and the dApp gets `UNSUPPORTED_METHOD`. ✅/❌

- [ ] **10. Disconnect from settings:**
      Open Settings → Connected apps. Tap a row → confirm modal → Disconnect. Uniswap loses the session. ✅/❌

- [ ] **11. dApp-initiated disconnect:**
      Disconnect from Uniswap's UI. The row disappears from the Safe app's list silently (no toast). ✅/❌

- [ ] **12. iOS + Android coverage:** Run smoke scenarios on both platforms. ✅/❌

- [ ] **13. Coexistence with Signer flows:** Open a Signer connection (existing flow) and a Wallet session in parallel. Both modals should render correctly on iOS without z-index conflicts; AppKit overlay does not block Wallet sheets and vice versa. ✅/❌

If any scenario fails: open a new task in this plan with the specific repro and fix. Re-verify the affected scenarios after the fix.

---

### Task 8.3: Push branch and open PR

- [ ] **Step 1: Sanity check**

```bash
git log --oneline dev..HEAD
git diff --stat dev..HEAD
```

Confirm: only `apps/mobile/`, `yarn.lock`, and config files are touched. No spurious changes to packages or web.

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/mobile-walletconnect-dapps-poc
```

Open a PR against `dev` titled e.g. `feat(mobile): WalletConnect dApps wallet-side POC`. PR body follows the repo template and includes:

- A two-line PR poem (per AGENTS.md).
- A Mermaid diagram of the request flow (session_proposal → slice → RequestSheetHost → response).
- A screenshot of `SessionProposalSheet` and `SendTransactionSheet`.
- The smoke-test checklist with results from Task 8.2.
- An explicit "No new tests in this PR — POC scope per spec" note in Risks.
- Spec link: [docs/superpowers/specs/2026-05-26-mobile-walletconnect-dapps-poc-wallet.md](../specs/2026-05-26-mobile-walletconnect-dapps-poc-wallet.md).

---

## Risk register & follow-ups (file as issues after merge)

Per the spec's "Known risks to spike during implementation" — track outcomes here and convert each into an issue if action is needed:

- **Android `wc://` intent collision** with AppKit's existing handler — gated by the Task 6.1 Step 1 pre-flight. If the pre-flight fails, deep links ship disabled for the POC and the follow-up is: introduce a Safe-specific scheme (e.g. `safe-wc://`) and have the QR scanner rewrite URIs.
- **`getPendingSessionRequests()` shape** — verify against the installed WalletKit version on first run; adjust `WalletKitProvider`'s seed loop if the shape differs.
- **iOS FullWindowOverlay coexistence** — verified manually in Task 8.2 #13.
- **`getCallsStatus` mapping** — the EIP-5792 status code mapping (100/200/400) is best-effort; if a real dApp exposes the status in its UI and surfaces something unexpected during smoke test #4, refine the mapping (e.g. distinguish "PENDING confirmations" from "PENDING execution").
- **Abandoned outstanding tx requests** — if the user taps Sign on `SendTransactionSheet`, navigates to `review-and-confirm`, then backs out without signing, the outstanding-request entry stays in the slice and the dApp's request times out client-side. Acceptable POC behavior, but file a follow-up to either (a) wire a "user navigated away from sign" event that responds with USER_REJECTED, or (b) GC outstanding entries on a TTL.
- **`wallet_addEthereumChain` follow-up call** — even with `4901` (matching web), some dApps still call `wallet_addEthereumChain` to recover. Safe doesn't implement that method, so the follow-up gets `UNSUPPORTED_METHOD`. Acceptable per spec; track for a future "implement `wallet_addEthereumChain` as a no-op success when the Safe is already deployed on the chain" follow-up.
