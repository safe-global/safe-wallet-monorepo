import { renderHook, act } from '@/src/tests/test-utils'
import { useSwitchNetwork } from '../useSwitchNetwork'

const mockAppKitSwitchNetwork = jest.fn().mockResolvedValue(undefined)
let mockWalletChainId: number | undefined = 1

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ switchNetwork: mockAppKitSwitchNetwork }),
  useAccount: () => ({ chainId: mockWalletChainId }),
}))

let mockActiveSafeChainId = '1'

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ chainId: mockActiveSafeChainId }),
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { warn: jest.fn() },
}))

describe('useSwitchNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletChainId = 1
    mockActiveSafeChainId = '1'
  })

  describe('isWrongNetwork', () => {
    it('returns false when wallet chain matches active safe chain', () => {
      mockWalletChainId = 1
      mockActiveSafeChainId = '1'

      const { result } = renderHook(() => useSwitchNetwork())

      expect(result.current.isWrongNetwork).toBe(false)
    })

    it('returns true when wallet chain differs from active safe chain', () => {
      mockWalletChainId = 137
      mockActiveSafeChainId = '1'

      const { result } = renderHook(() => useSwitchNetwork())

      expect(result.current.isWrongNetwork).toBe(true)
    })

    it('returns true when wallet chainId is undefined', () => {
      mockWalletChainId = undefined
      mockActiveSafeChainId = '1'

      const { result } = renderHook(() => useSwitchNetwork())

      expect(result.current.isWrongNetwork).toBe(true)
    })
  })

  describe('switchNetworkIfNeeded', () => {
    it('does not call switchNetwork when chains match', async () => {
      mockWalletChainId = 1
      mockActiveSafeChainId = '1'

      const { result } = renderHook(() => useSwitchNetwork())

      await act(() => result.current.switchNetworkIfNeeded())

      expect(mockAppKitSwitchNetwork).not.toHaveBeenCalled()
    })

    it('calls switchNetwork with eip155 format when chains differ', async () => {
      mockWalletChainId = 137
      mockActiveSafeChainId = '1'

      const { result } = renderHook(() => useSwitchNetwork())

      await act(() => result.current.switchNetworkIfNeeded())

      expect(mockAppKitSwitchNetwork).toHaveBeenCalledWith('eip155:1')
    })

    it('swallows errors from switchNetwork', async () => {
      mockWalletChainId = 137
      mockActiveSafeChainId = '1'
      mockAppKitSwitchNetwork.mockRejectedValueOnce(new Error('Switch failed'))

      const { result } = renderHook(() => useSwitchNetwork())

      await expect(act(() => result.current.switchNetworkIfNeeded())).resolves.not.toThrow()
    })
  })

  describe('switchNetwork', () => {
    it('calls appKit switchNetwork with eip155 prefix', async () => {
      const { result } = renderHook(() => useSwitchNetwork())

      await act(() => result.current.switchNetwork('137'))

      expect(mockAppKitSwitchNetwork).toHaveBeenCalledWith('eip155:137')
    })
  })
})
