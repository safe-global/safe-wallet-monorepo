import type { SessionTypes } from '@walletconnect/types'
import type { Router } from 'expo-router'
import type { WalletKitTypes } from '@reown/walletkit'
import { store } from '@/src/store'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { selectBiometricsEnabled } from '@/src/store/biometricsSlice'
import { keyStorageService } from '@/src/services/key-storage'
import {
  addSession,
  clearWalletKitState,
  selectPending,
  selectSessionsRecord,
  selectVerifyByTopic,
  sessionRequestReceived,
  type PendingSessionProposal,
} from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { isValidTxRequestParams } from '@/src/features/WalletConnect/Wallet/services/methodRouter'
import { walletKitE2eState, E2E_SESSION_TOPIC } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { APPROVED_SESSION, getWalletKit } from '@/src/features/WalletConnect/Wallet/walletKit.e2e'
import { mockedActiveAccount } from '../mockData'
import {
  seedWcSession,
  synthSessionProposalValid,
  synthSessionProposalUnverified,
  synthSessionProposalScam,
  synthSessionDelete,
  synthTxRequest,
  synthTxBatch,
  setWcPairHang,
  armProposeFailure,
  setupWcDappsTx,
  E2E_TX_OWNER_ADDRESS,
} from '../walletConnectDappsSetup'

// Stub the network (chains re-fetch) and navigation pieces of the base setup.
jest.mock('../setupHelpers', () => ({
  ...jest.requireActual('../setupHelpers'),
  resetReduxForE2E: jest.fn(),
  onboardAndNavigate: jest.fn(),
}))

// useSign.ts binds keyStorageService methods at module load — the mock must provide them all.
jest.mock('@/src/services/key-storage', () => ({
  keyStorageService: {
    storePrivateKey: jest.fn().mockResolvedValue(undefined),
    getPrivateKey: jest.fn(),
    removePrivateKey: jest.fn(),
  },
  walletService: { createMnemonicAccount: jest.fn(), createWallet: jest.fn() },
}))

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

  it('seedWcSession puts the approved-session fixture in the slice as verified', () => {
    seedWcSession()
    expect(selectSessionsRecord(store.getState())[E2E_SESSION_TOPIC]).toEqual(APPROVED_SESSION)
    expect(selectVerifyByTopic(store.getState())[E2E_SESSION_TOPIC]).toBe('verified')
  })

  it('seedWcSession seeds the fake WalletKit so getActiveSessions reflects the session', async () => {
    seedWcSession()
    const walletKit = await getWalletKit()
    expect(walletKit.getActiveSessions()[E2E_SESSION_TOPIC]).toEqual(APPROVED_SESSION)
  })

  it('synthSessionDelete removes a seeded session from the slice and the fake', async () => {
    seedWcSession()
    synthSessionDelete()
    expect(selectSessionsRecord(store.getState())[E2E_SESSION_TOPIC]).toBeUndefined()
    const walletKit = await getWalletKit()
    expect(walletKit.getActiveSessions()[E2E_SESSION_TOPIC]).toBeUndefined()
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

describe('walletConnectDappsSetup tx requests', () => {
  const findSessionRequest = (dispatchSpy: jest.SpyInstance): WalletKitTypes.SessionRequest => {
    const action = dispatchSpy.mock.calls.map(([a]) => a).find((a) => sessionRequestReceived.match(a))
    if (!action) {
      throw new Error('sessionRequestReceived was not dispatched')
    }
    return action.payload
  }

  let dispatchSpy: jest.SpyInstance

  beforeEach(() => {
    store.dispatch(clearWalletKitState())
    walletKitE2eState.reset()
    dispatchSpy = jest.spyOn(store, 'dispatch')
  })

  afterEach(() => {
    dispatchSpy.mockRestore()
  })

  it('synthTxRequest dispatches an eth_sendTransaction the router accepts structurally', () => {
    synthTxRequest()
    const request = findSessionRequest(dispatchSpy)
    expect(request.params.chainId).toBe(`eip155:${mockedActiveAccount.chainId}`)

    expect(request.topic).toBe(E2E_SESSION_TOPIC)
    expect(request.params.chainId).toBe(`eip155:${mockedActiveAccount.chainId}`)
    expect(request.params.request.method).toBe('eth_sendTransaction')
    expect(isValidTxRequestParams('eth_sendTransaction', request.params.request.params)).toBe(true)
  })

  it('synthTxBatch dispatches a wallet_sendCalls bundle matching the router contract', () => {
    synthTxBatch()
    const request = findSessionRequest(dispatchSpy)

    expect(request.params.request.method).toBe('wallet_sendCalls')
    const [bundle] = request.params.request.params as [{ chainId: string; from: string; calls: unknown[] }]
    // The router compares numerically and case-insensitively — mirror that here.
    expect(BigInt(bundle.chainId)).toBe(BigInt(mockedActiveAccount.chainId))
    expect(sameAddress(bundle.from, mockedActiveAccount.address)).toBe(true)
    expect(bundle.calls).toHaveLength(2)
    expect(isValidTxRequestParams('wallet_sendCalls', request.params.request.params)).toBe(true)
  })

  it('synthTxRequest jitters the value so consecutive runs cannot collide on safeTxHash', () => {
    synthTxRequest()
    synthTxRequest()
    const values = dispatchSpy.mock.calls
      .map(([a]) => a)
      .filter((a) => sessionRequestReceived.match(a))
      .map((a) => (a.payload.params.request.params as [{ value: string }])[0].value)
    expect(values).toHaveLength(2)
    expect(values[0]).not.toBe(values[1])
  })

  it('armProposeFailure arms the propose fetch interceptor', () => {
    armProposeFailure()
    expect(walletKitE2eState.get().proposeBehavior).toBe('fail500')
  })

  it('setupWcDappsTx reports failed setup when the keychain write rejects', async () => {
    const router = { replace: jest.fn() } as unknown as Router
    jest.mocked(keyStorageService.storePrivateKey).mockRejectedValueOnce(new Error('keychain unavailable'))

    await expect(setupWcDappsTx(store.dispatch, router)).rejects.toThrow('keychain unavailable')
    expect(walletKitE2eState.get().txSetupStatus).toBe('failed')
  })

  it('setupWcDappsTx seeds an owner signer with a keychain key and enables biometrics', async () => {
    const router = { replace: jest.fn() } as unknown as Router
    await setupWcDappsTx(store.dispatch, router)

    const state = store.getState()
    expect(walletKitE2eState.get().txSetupStatus).toBe('ready')
    expect(state.signers[E2E_TX_OWNER_ADDRESS]).toBeDefined()
    expect(state.activeSigner[mockedActiveAccount.address]?.value).toBe(E2E_TX_OWNER_ADDRESS)
    expect(selectBiometricsEnabled(state)).toBe(true)
    expect(selectSessionsRecord(state)[E2E_SESSION_TOPIC]).toEqual(APPROVED_SESSION)
    expect(keyStorageService.storePrivateKey).toHaveBeenCalledWith(
      E2E_TX_OWNER_ADDRESS,
      expect.stringMatching(/^0x[0-9a-f]{64}$/),
      { requireAuthentication: false },
    )
  })
})
