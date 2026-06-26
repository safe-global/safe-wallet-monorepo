import type { SessionTypes } from '@walletconnect/types'
import { store } from '@/src/store'
import {
  addSession,
  clearWalletKitState,
  selectPending,
  selectSessionsRecord,
  type PendingSessionProposal,
} from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { walletKitE2eState, E2E_SESSION_TOPIC } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import {
  synthSessionProposalValid,
  synthSessionProposalUnverified,
  synthSessionProposalScam,
  synthSessionDelete,
  setWcPairHang,
} from '../walletConnectDappsSetup'

const getProposals = () =>
  selectPending(store.getState()).filter((p): p is PendingSessionProposal => p.kind === 'proposal')

describe('walletConnectDappsSetup synthesis', () => {
  beforeEach(() => {
    store.dispatch(clearWalletKitState())
    walletKitE2eState.reset()
  })

  it('synthSessionProposalValid pushes a VALID proposal into the slice', () => {
    synthSessionProposalValid()
    const proposals = getProposals()
    expect(proposals).toHaveLength(1)
    expect(proposals[0].proposal.verifyContext?.verified?.validation).toBe('VALID')
    expect(proposals[0].proposal.verifyContext?.verified?.isScam).toBeUndefined()
    // The pending id matches the proposal id so approve/reject can target it.
    expect(proposals[0].id).toBe(proposals[0].proposal.id)
  })

  it('synthSessionProposalUnverified pushes an UNKNOWN-verify proposal', () => {
    synthSessionProposalUnverified()
    expect(getProposals()[0].proposal.verifyContext?.verified?.validation).toBe('UNKNOWN')
  })

  it('synthSessionProposalScam pushes a scam-flagged proposal', () => {
    synthSessionProposalScam()
    expect(getProposals()[0].proposal.verifyContext?.verified?.isScam).toBe(true)
  })

  it('synthSessionDelete removes the fixture session from the slice', () => {
    const fixtureSession = { topic: E2E_SESSION_TOPIC } as SessionTypes.Struct
    store.dispatch(addSession({ session: fixtureSession, verifyVariant: 'verified' }))
    expect(selectSessionsRecord(store.getState())[E2E_SESSION_TOPIC]).toBeDefined()

    synthSessionDelete()
    expect(selectSessionsRecord(store.getState())[E2E_SESSION_TOPIC]).toBeUndefined()
  })

  it('setWcPairHang arms the fake pair() to hang', () => {
    setWcPairHang()
    expect(walletKitE2eState.get().pairBehavior).toBe('hang')
  })
})
