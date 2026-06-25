/**
 * E2E override for `walletKit.ts` (selected by Metro via RN_SRC_EXT=e2e.ts).
 *
 * Replaces the relay-backed WalletKit with a deterministic fake so Maestro
 * flows never depend on a live relay node or an external dApp fixture. Only the
 * surface the Wallet feature actually calls is implemented; everything else is
 * a resolved no-op. Behaviour is driven by `walletKitE2eState`.
 *
 * session_proposal / session_request / session_delete events are NOT emitted
 * through the SDK here — they are synthesised by dispatching fixture payloads
 * straight into `walletKitSlice` from TestCtrls (see walletConnectDappsSetup).
 * So `on`/`off` are intentionally no-ops.
 */
import type { IWalletKit } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { walletKitE2eState } from './walletKitE2eState'
import { APPROVED_SESSION } from '@/src/tests/e2e-maestro/setup/walletConnectDappsSetup'

const asyncNoop = async (): Promise<void> => undefined
const noop = (): void => undefined

const fakeWalletKit = {
  on: noop,
  off: noop,
  emitSessionEvent: asyncNoop,
  updateSession: asyncNoop,
  rejectSessionAuthenticate: asyncNoop,
  respondSessionRequest: asyncNoop,

  // Reflects approved sessions so the controller's setSessions(getActiveSessions())
  // on init/expiry stays consistent with the slice instead of clobbering it with {}.
  getActiveSessions: (): Record<string, SessionTypes.Struct> => walletKitE2eState.get().sessions,
  getPendingSessionRequests: () => [],

  pair: async (_params: { uri: string }): Promise<void> => {
    const { pairBehavior } = walletKitE2eState.get()
    if (pairBehavior === 'reject') {
      throw new Error('E2E pair rejected')
    }
    if (pairBehavior === 'hang') {
      // Never resolves: the scanner's PAIR_TIMEOUT_MS timer fires the timeout overlay.
      return new Promise<void>(() => undefined)
    }
    // 'resolve': pairs instantly. The proposal is synthesised separately via TestCtrls.
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

// The fake implements only the methods the Wallet feature invokes; narrow the
// cast to IWalletKit rather than widening callers with `any`.
const instance = fakeWalletKit as unknown as IWalletKit

export const getWalletKit = (): Promise<IWalletKit> => Promise.resolve(instance)
