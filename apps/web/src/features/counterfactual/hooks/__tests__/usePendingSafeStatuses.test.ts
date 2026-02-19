import { renderHook, waitFor } from '@/tests/test-utils'
import usePendingSafeStatus from '../usePendingSafeStatuses'
import { SafeCreationEvent, safeCreationDispatch, safeCreationSubscribe } from '../../services/safeCreationEvents'
import { pollSafeInfo } from '@/components/new-safe/create/logic'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'

jest.mock('../../services/safeCreationEvents', () => {
  const actual = jest.requireActual('../../services/safeCreationEvents')
  return {
    ...actual,
    safeCreationSubscribe: jest.fn(),
    safeCreationDispatch: jest.fn(),
  }
})

jest.mock('@/components/new-safe/create/logic', () => ({
  pollSafeInfo: jest.fn(),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3ReadOnly: jest.fn(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  CREATE_SAFE_EVENTS: {},
  MixpanelEventParams: {},
}))

jest.mock('@/utils/wallets', () => ({
  isSmartContract: jest.fn(),
}))

const mockUseChainId = jest.requireMock('@/hooks/useChainId').default as jest.Mock
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock
const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseWeb3ReadOnly = jest.requireMock('@/hooks/wallets/web3ReadOnly').useWeb3ReadOnly as jest.Mock
const mockIsSmartContract = jest.requireMock('@/utils/wallets').isSmartContract as jest.Mock

describe('usePendingSafeStatuses', () => {
  const chainId = '1'
  const currentSafeAddress = '0x1111111111111111111111111111111111111111'
  const otherSafeAddress = '0x2222222222222222222222222222222222222222'

  const setupMocks = (safeAddress: string) => {
    mockUseChainId.mockReturnValue(chainId)
    mockUseCurrentChain.mockReturnValue({ chainId, chainName: 'Ethereum' })
    mockUseSafeInfo.mockReturnValue({
      safe: { ...defaultSafeInfo, chainId, address: { value: safeAddress } },
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })
    mockUseWeb3ReadOnly.mockReturnValue({
      getBlockNumber: jest.fn().mockResolvedValue(123),
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(chainId) }),
    })
    mockIsSmartContract.mockResolvedValue(false)
  }

  beforeEach(() => {
    jest.resetAllMocks()
    ;(pollSafeInfo as jest.Mock).mockResolvedValue(undefined)
  })

  it('polls CGW only for the current safe on SUCCESS', async () => {
    setupMocks(currentSafeAddress)

    const subscriptions: Record<string, (detail: unknown) => void> = {}
    ;(safeCreationSubscribe as jest.Mock).mockImplementation((event, callback) => {
      subscriptions[event] = callback
      return jest.fn()
    })

    renderHook(() => usePendingSafeStatus(), { initialReduxState: { undeployedSafes: {} } })

    subscriptions[SafeCreationEvent.SUCCESS]?.({
      groupKey: 'group',
      safeAddress: currentSafeAddress,
      chainId,
      type: PayMethod.PayLater,
    })

    await waitFor(() => {
      expect(pollSafeInfo).toHaveBeenCalledWith(chainId, currentSafeAddress)
      expect(safeCreationDispatch).toHaveBeenCalledWith(SafeCreationEvent.INDEXED, {
        groupKey: 'group',
        safeAddress: currentSafeAddress,
        chainId,
      })
    })
  })

  it('skips CGW polling for non-current safes on SUCCESS', async () => {
    setupMocks(currentSafeAddress)

    const subscriptions: Record<string, (detail: unknown) => void> = {}
    ;(safeCreationSubscribe as jest.Mock).mockImplementation((event, callback) => {
      subscriptions[event] = callback
      return jest.fn()
    })

    renderHook(() => usePendingSafeStatus(), { initialReduxState: { undeployedSafes: {} } })

    subscriptions[SafeCreationEvent.SUCCESS]?.({
      groupKey: 'group',
      safeAddress: otherSafeAddress,
      chainId,
      type: PayMethod.PayLater,
    })

    await waitFor(() => {
      expect(pollSafeInfo).not.toHaveBeenCalled()
      expect(safeCreationDispatch).toHaveBeenCalledWith(SafeCreationEvent.INDEXED, {
        groupKey: 'group',
        safeAddress: otherSafeAddress,
        chainId,
      })
    })
  })
})
