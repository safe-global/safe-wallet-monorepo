import { act } from '@testing-library/react-native'
import type { IWalletKit } from '@reown/walletkit'
import { renderHookWithStore, createTestStore } from '@/src/tests/test-utils'
import { useSendTransaction } from '../useSendTransaction'
import { composeSafeTxDraft } from '../../services/composeSafeTxDraft'
import { walletKitSliceName, type PendingSessionRequest } from '../../store/walletKitSlice'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({ useSafeSDK: () => ({}) }))

jest.mock('@/src/store/chains', () => ({ selectChainById: () => ({ chainId: '1' }) }))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useSafesGetSafeV1Query: () => ({ data: { version: '1.3.0', owners: [], threshold: 1 } }),
}))

jest.mock('../../services/composeSafeTxDraft', () => ({ composeSafeTxDraft: jest.fn() }))
const mockCompose = composeSafeTxDraft as jest.Mock

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const SAFE_TX_HASH = '0xhash'

const pending: PendingSessionRequest = {
  kind: 'request',
  id: 9,
  topic: 'topic',
  chainId: 'eip155:1',
  method: 'eth_sendTransaction',
  params: [{ to: '0xabc', value: '0x0', data: '0x' }],
}

const mockRespond = jest.fn().mockResolvedValue(undefined)
const walletKit = { respondSessionRequest: mockRespond } as unknown as IWalletKit

const seededStore = () =>
  createTestStore({
    activeSafe: { address: SAFE_ADDRESS, chainId: '1' },
    [walletKitSliceName]: { sessions: {}, pending: [pending], outstandingRequests: {} },
  } as never)

beforeEach(() => jest.clearAllMocks())

describe('useSendTransaction', () => {
  it('reports ready once Safe, chain and SDK are resolved', () => {
    const { result } = renderHookWithStore(() => useSendTransaction(walletKit, pending), seededStore())
    expect(result.current.ready).toBe(true)
  })

  it('reject answers the dApp with USER_REJECTED and clears the pending request', async () => {
    const store = seededStore()
    const { result } = renderHookWithStore(() => useSendTransaction(walletKit, pending), store)
    await act(async () => {
      await result.current.reject()
    })
    expect(mockRespond).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'topic', response: expect.objectContaining({ error: expect.anything() }) }),
    )
    expect(store.getState()[walletKitSliceName].pending).toHaveLength(0)
  })

  it('review composes a draft, stashes the outstanding request, and navigates to the confirm flow', async () => {
    mockCompose.mockResolvedValue(SAFE_TX_HASH)
    const store = seededStore()
    const { result } = renderHookWithStore(() => useSendTransaction(walletKit, pending), store)
    await act(async () => {
      await result.current.review()
    })
    expect(mockCompose).toHaveBeenCalledTimes(1)
    expect(store.getState()[walletKitSliceName].outstandingRequests[SAFE_TX_HASH]).toMatchObject({
      topic: 'topic',
      id: 9,
      method: 'eth_sendTransaction',
    })
    expect(store.getState()[walletKitSliceName].pending).toHaveLength(0)
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/confirm-transaction', params: { txId: SAFE_TX_HASH } })
  })

  it('review toasts and stays on the sheet when the preview fails', async () => {
    mockCompose.mockRejectedValue(new Error('preview failed'))
    const store = seededStore()
    const { result } = renderHookWithStore(() => useSendTransaction(walletKit, pending), store)
    await act(async () => {
      await result.current.review()
    })
    expect(mockToastShow).toHaveBeenCalledWith('Failed to build transaction', expect.anything())
    expect(mockPush).not.toHaveBeenCalled()
    // No outstanding request, pending retained → user can retry or reject.
    expect(store.getState()[walletKitSliceName].outstandingRequests).toEqual({})
    expect(store.getState()[walletKitSliceName].pending).toHaveLength(1)
  })
})
