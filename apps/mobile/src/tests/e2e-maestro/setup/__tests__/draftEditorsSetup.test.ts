import type { Router } from 'expo-router'
import { store } from '@/src/store'
import { composeSafeTxDraft } from '@/src/features/WalletConnect/Wallet/services/composeSafeTxDraft'
import { draftEditorsE2eState } from '../draftEditorsE2eState'
import { setupSendFlow, setupApprovalDraft } from '../draftEditorsSetup'
import { mockedActiveAccount } from '../mockData'

// Stub the network (chains re-fetch) and navigation pieces of the base setup.
jest.mock('../setupHelpers', () => ({
  ...jest.requireActual('../setupHelpers'),
  resetReduxForE2E: jest.fn(),
  onboardAndNavigate: jest.fn(),
}))

jest.mock('@/src/store/chains', () => ({
  ...jest.requireActual('@/src/store/chains'),
  selectChainById: jest.fn(() => ({ chainId: '11155111' })),
}))

jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({
  ...jest.requireActual('@/src/hooks/coreSDK/safeCoreSDK'),
  getSafeSDK: jest.fn(() => ({})),
}))

jest.mock('@/src/features/WalletConnect/Wallet/services/composeSafeTxDraft', () => ({
  composeSafeTxDraft: jest.fn().mockResolvedValue('0xdrafthash'),
}))

const mockSafeState = { owners: [{ value: '0x1' }], threshold: 1, version: '1.4.1' }
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => {
  const actual = jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/safes')
  return {
    ...actual,
    cgwApi: {
      ...actual.cgwApi,
      endpoints: {
        ...actual.cgwApi.endpoints,
        safesGetSafeV1: {
          ...actual.cgwApi.endpoints.safesGetSafeV1,
          initiate: () => () => ({ unwrap: async () => mockSafeState }),
        },
      },
    },
  }
})

const makeRouter = () => ({ replace: jest.fn(), push: jest.fn() }) as unknown as Router

describe('draftEditorsSetup', () => {
  beforeEach(() => {
    draftEditorsE2eState.reset()
    jest.mocked(composeSafeTxDraft).mockResolvedValue('0xdrafthash')
  })

  it('setupSendFlow seeds an owner signer as active signer', () => {
    setupSendFlow(store.dispatch, makeRouter())

    const state = store.getState()
    const owner = '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472'
    expect(state.signers[owner]).toBeDefined()
    expect(state.activeSigner[mockedActiveAccount.address]?.value).toBe(owner)
  })

  it('setupApprovalDraft composes an approve multiSend draft and opens the confirm screen', async () => {
    const router = makeRouter()
    await setupApprovalDraft(store.dispatch, router)

    expect(composeSafeTxDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: mockedActiveAccount.chainId,
        safeAddress: mockedActiveAccount.address,
        safe: mockSafeState,
        calls: [
          expect.objectContaining({ data: expect.stringMatching(/^0x095ea7b3/) }),
          expect.objectContaining({ data: '0x' }),
        ],
      }),
    )
    expect(router.push).toHaveBeenCalledWith({ pathname: '/confirm-transaction', params: { txId: '0xdrafthash' } })
    expect(draftEditorsE2eState.get().setupStatus).toBe('ready')
  })

  it('setupApprovalDraft reports failure when composing rejects', async () => {
    jest.mocked(composeSafeTxDraft).mockRejectedValueOnce(new Error('compose failed'))

    await expect(setupApprovalDraft(store.dispatch, makeRouter())).rejects.toThrow('compose failed')
    expect(draftEditorsE2eState.get().setupStatus).toBe('failed')
  })
})
