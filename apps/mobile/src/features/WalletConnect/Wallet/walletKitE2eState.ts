/**
 * Shared state for E2E testing of the WalletConnect dApp (Wallet-side) flows.
 *
 * TestCtrls buttons call set() to configure the fake WalletKit's behaviour and
 * to force-enable the NATIVE_WALLETCONNECT feature. The fake WalletKit
 * (walletKit.e2e.ts) and useHasFeature.e2e.ts read it via get().
 *
 * Mirrors the Signer-side `walletConnectE2eState`. Maestro cannot call app-side
 * JS, so every scenario is driven by tapping a hidden TestCtrls button that
 * mutates this singleton and/or dispatches fixture events into `walletKitSlice`.
 */
import type { SessionTypes } from '@walletconnect/types'
import { createE2eStore } from '@/src/tests/e2e-maestro/createE2eStore'

/** Topic of the fixture session the fake approves; shared so synthSessionDelete targets it. */
export const E2E_SESSION_TOPIC = 'e2e-session-topic'

/** What the fake `getWalletKit().pair()` should do for the next scan/deep-link. */
export type PairBehavior = 'resolve' | 'hang' | 'reject'

export interface WalletKitE2eState {
  /**
   * Force the NATIVE_WALLETCONNECT feature on regardless of the remote chains
   * config, so the header QR button and WalletKitController mount in E2E.
   * Read by useHasFeature.e2e.ts.
   */
  forceNativeWalletConnect: boolean

  /**
   * Drives the fake `pair()`:
   *  - 'resolve' → pairs instantly (happy path / deep link)
   *  - 'hang'    → never resolves, so the scanner's 10s timer fires (timeout flow)
   *  - 'reject'  → throws (pair-error overlay)
   */
  pairBehavior: PairBehavior

  /**
   * Active sessions the fake WalletKit reports via getActiveSessions(), keyed by
   * topic. approveSession() adds to it and disconnect/delete remove from it, so
   * the controller's setSessions(getActiveSessions()) on init/expiry stays
   * consistent with the slice instead of wiping approved sessions with {}.
   */
  sessions: Record<string, SessionTypes.Struct>

  /**
   * Set true by the fake `rejectSession()`. Side-channel surfaced via the
   * `e2e-wc-reject-called` test-id so the reject flow can assert it.
   */
  rejectSessionCalled: boolean
}

const initialState: WalletKitE2eState = {
  forceNativeWalletConnect: false,
  pairBehavior: 'resolve',
  sessions: {},
  rejectSessionCalled: false,
}

export const walletKitE2eState = createE2eStore('walletKitE2eState', initialState)
