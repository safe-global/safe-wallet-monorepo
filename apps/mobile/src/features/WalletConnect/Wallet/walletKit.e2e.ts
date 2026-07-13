/**
 * E2E override for `walletKit.ts` (Metro picks it via RN_SRC_EXT=e2e.ts): a
 * deterministic fake so Maestro never depends on a live relay. Events are
 * synthesised straight into `walletKitSlice` (see walletConnectDappsSetup), so
 * `on`/`off` are no-ops; behaviour is driven by `walletKitE2eState`.
 */
import type { IWalletKit } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { walletKitE2eState, E2E_SESSION_TOPIC, E2E_PAIRING_TOPIC } from './walletKitE2eState'

// Recursively freeze so a caller mutating a nested field (e.g. namespaces.accounts)
// can't corrupt the shared singleton — getActiveSessions hands out this same ref.
const deepFreeze = <V>(value: V): V => {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

/** Session approveSession() returns; values mirror the test Safe but aren't asserted. */
export const APPROVED_SESSION: SessionTypes.Struct = deepFreeze({
  topic: E2E_SESSION_TOPIC,
  pairingTopic: E2E_PAIRING_TOPIC,
  relay: { protocol: 'irn' },
  expiry: 0,
  acknowledged: true,
  controller: 'self',
  namespaces: {
    eip155: {
      chains: ['eip155:11155111'],
      accounts: ['eip155:11155111:0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6'],
      methods: ['eth_sendTransaction', 'wallet_sendCalls'],
      events: ['chainChanged', 'accountsChanged'],
    },
  },
  requiredNamespaces: {},
  optionalNamespaces: {},
  self: { publicKey: 'self', metadata: { name: 'Safe', description: '', url: '', icons: [] } },
  peer: {
    publicKey: 'e2e-proposer-pubkey',
    metadata: {
      name: 'Uniswap',
      description: 'Swap or provide liquidity on the Uniswap Protocol',
      url: 'https://app.uniswap.org',
      icons: [],
    },
  },
})

const asyncNoop = async (): Promise<void> => undefined
const noop = (): void => undefined

// Structural twin of jsonrpc-utils' JsonRpcResult | JsonRpcError (avoids depending
// on @walletconnect/jsonrpc-types directly).
type JsonRpcResponseLike = { id: number; result?: unknown; error?: { code: number; message: string } }

const fakeWalletKit = {
  on: noop,
  off: noop,
  emitSessionEvent: asyncNoop,
  updateSession: asyncNoop,
  rejectSessionAuthenticate: asyncNoop,

  // Records what the app would deliver to the dApp; WcResponseIndicator surfaces it to Maestro.
  respondSessionRequest: async (params: { topic: string; response: JsonRpcResponseLike }): Promise<void> => {
    const { topic, response } = params
    walletKitE2eState.set({
      lastRequestResponse: {
        topic,
        id: response.id,
        ...('result' in response ? { result: response.result } : {}),
        ...(response.error ? { error: { code: response.error.code, message: response.error.message } } : {}),
      },
    })
  },

  // Reflects approved sessions so setSessions(getActiveSessions()) can't clobber the slice.
  // Spread so callers can't mutate the singleton's map (real getActiveSessions returns fresh).
  getActiveSessions: (): Record<string, SessionTypes.Struct> => ({ ...walletKitE2eState.get().sessions }),
  getPendingSessionRequests: () => [],

  pair: async (_params: { uri: string }): Promise<void> => {
    const { pairBehavior } = walletKitE2eState.get()
    if (pairBehavior === 'reject') {
      throw new Error('E2E pair rejected')
    }
    if (pairBehavior === 'hang') {
      // Never resolves → the scanner's PAIR_TIMEOUT_MS timer fires the timeout overlay.
      return new Promise<void>(() => undefined)
    }
  },

  approveSession: async (_params: unknown): Promise<SessionTypes.Struct> => {
    const { sessions } = walletKitE2eState.get()
    walletKitE2eState.set({ sessions: { ...sessions, [APPROVED_SESSION.topic]: APPROVED_SESSION } })
    return APPROVED_SESSION
  },

  disconnectSession: async (params: { topic: string }): Promise<void> => {
    const { [params.topic]: _removed, ...rest } = walletKitE2eState.get().sessions
    walletKitE2eState.set({ sessions: rest })
  },

  rejectSession: async (_params: unknown): Promise<void> => {
    // Side-channel for the reject flow (surfaced via the e2e-wc-reject-called test-id).
    walletKitE2eState.set({ rejectSessionCalled: true })
  },
}

// Unimplemented methods default to a resolved no-op so a new app-side WalletKit
// call can't crash mid-flow. `then`/symbols must stay undefined, or await would
// treat the fake as a thenable and hang. Trade-off: if the SDK renames a method
// the fake stubs (e.g. approveSession), flows pass but no session lands — revisit
// the explicit method list above on @reown/walletkit bumps.
const instance = new Proxy(fakeWalletKit, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver)
    }
    return prop === 'then' || typeof prop === 'symbol' ? undefined : asyncNoop
  },
}) as unknown as IWalletKit

export const getWalletKit = (): Promise<IWalletKit> => Promise.resolve(instance)
