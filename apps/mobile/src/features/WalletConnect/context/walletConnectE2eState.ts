/**
 * Shared state for E2E testing of WalletConnect flows.
 *
 * TestCtrls buttons call set() to configure mock connection results.
 * WalletConnectContext.e2e.tsx subscribes via useSyncExternalStore.
 */

export interface WalletConnectE2eState {
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

  /** Session state (read by WalletConnectGate via useWalletConnectStatus) */
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  walletInfo: { name: string; icon?: string } | undefined

  /** Gate states */
  isWrongNetwork: boolean
  hasProvider: boolean
}

const initialState: WalletConnectE2eState = {
  connectResult: null,
  connectError: null,
  isOwner: false,
  isConnected: false,
  address: undefined,
  chainId: undefined,
  walletInfo: undefined,
  isWrongNetwork: false,
  hasProvider: false,
}

let listeners: (() => void)[] = []
let state: WalletConnectE2eState = { ...initialState }

function get(): WalletConnectE2eState {
  return state
}

function set(next: Partial<WalletConnectE2eState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function reset() {
  state = { ...initialState }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export const walletConnectE2eState = { get, set, reset, subscribe }
