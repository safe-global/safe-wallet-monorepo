/**
 * Shared state for E2E testing of WalletConnect flows.
 *
 * TestCtrls buttons call set() to configure mock connection results.
 * WalletConnectContext.e2e.tsx subscribes via useSyncExternalStore.
 */

export interface WalletConnectE2eState {
  // ── Scenario directives — drive what the next mock call should do ────────

  /** What initiateConnection resolves with (happy path) */
  connectResult: {
    address: string
    walletName: string
    walletIcon: string
  } | null

  /** What initiateConnection rejects with (error path) */
  connectError: 'connect_error' | 'user_rejected' | null

  /**
   * Whether the connected address should be treated as a Safe owner.
   * Bypasses the real CGW API call for deterministic E2E tests.
   */
  isOwner: boolean

  /**
   * Single-shot: when true, the next reconnect() routes to
   * `/import-signers/reconnect-error` AND clears this flag, so a follow-up
   * retry succeeds. Mirrors the user journey "wrong wallet connected →
   * reconnect with the right one". See WalletConnectContext.e2e.tsx.
   */
  reconnectMismatch: boolean

  // ── Session state — what a real WC provider would expose downstream ─────

  isConnected: boolean
  address: string | undefined
  chainId: string | undefined
  walletInfo: { name: string; icon?: string } | undefined
  isWrongNetwork: boolean
  hasProvider: boolean
}

const initialState: WalletConnectE2eState = {
  connectResult: null,
  connectError: null,
  isOwner: false,
  reconnectMismatch: false,
  isConnected: false,
  address: undefined,
  chainId: undefined,
  walletInfo: undefined,
  isWrongNetwork: false,
  hasProvider: false,
}

let listeners: (() => void)[] = []
let state: WalletConnectE2eState = { ...initialState }

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener()
    } catch (error) {
      console.error('[E2E] walletConnectE2eState listener error:', error)
    }
  }
}

function get(): WalletConnectE2eState {
  return state
}

function set(next: Partial<WalletConnectE2eState>) {
  state = { ...state, ...next }
  notifyListeners()
}

function reset() {
  state = { ...initialState }
  notifyListeners()
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export const walletConnectE2eState = { get, set, reset, subscribe }
