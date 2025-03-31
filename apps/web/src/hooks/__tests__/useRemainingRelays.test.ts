import { renderHook, waitFor } from '@/tests/test-utils'
import { useLeastRemainingRelays, useRelaysBySafe } from '@/hooks/useRemainingRelays'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import * as gateway from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES } from '@safe-global/utils/utils/chains'

const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'

describe('fetch remaining relays hooks', () => {
  const mockChain = chainBuilder()
    // @ts-expect-error - using local FEATURES enum
    .with({ features: [FEATURES.RELAYING] })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: {
        txHistoryTag: '0',
      },
      safeAddress: SAFE_ADDRESS,
    } as ReturnType<typeof useSafeInfo.default>)
  })

  describe('useRelaysBySafe hook', () => {
    it('should not do a network request if chain does not support relay', () => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ features: [] }).build())

      const mockFetch = jest.spyOn(gateway, 'getRelayCount')

      renderHook(() => useRelaysBySafe())
      expect(mockFetch).toHaveBeenCalledTimes(0)
    })

    it('refetch if the txHistoryTag changes', () => {
      const mockFetch = jest.spyOn(gateway, 'getRelayCount')

      const render = renderHook(() => useRelaysBySafe())
      expect(mockFetch).toHaveBeenCalledTimes(1)

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: {
          txHistoryTag: 'new',
        },
        safeAddress: SAFE_ADDRESS,
      } as ReturnType<typeof useSafeInfo.default>)

      render.rerender()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('useLeastRemainingRelays hook', () => {
    const ownerAddresses = ['0x00', '0x01', '0x02']

    it('should return 0 if one of the owners has no remaining relays', async () => {
      jest
        .spyOn(gateway, 'getRelayCount')
        .mockResolvedValue({ limit: 5, remaining: 3 })
        .mockResolvedValueOnce({ limit: 5, remaining: 0 })
        .mockResolvedValueOnce({ limit: 5, remaining: 5 })

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(async () => {
        expect(result.current[0]?.remaining).toBe(0)
      })
    })

    it('should return the minimum number of relays amongst owners', async () => {
      jest
        .spyOn(gateway, 'getRelayCount')
        .mockResolvedValue({ limit: 5, remaining: 3 })
        .mockResolvedValueOnce({ limit: 5, remaining: 2 })
        .mockResolvedValueOnce({ limit: 5, remaining: 5 })

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(async () => {
        expect(result.current[0]?.remaining).toBe(2)
      })
    })

    it('should return 0 if there is an error fetching the remaining relays', async () => {
      jest
        .spyOn(gateway, 'getRelayCount')
        .mockResolvedValue({ limit: 5, remaining: 3 })
        .mockRejectedValueOnce('Failed to fetch')
        .mockResolvedValueOnce({ limit: 5, remaining: 2 })

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(async () => {
        expect(result.current[0]?.remaining).toBe(0)
      })
    })

    it('should not do a network request if chain does not support relay', () => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ features: [] }).build())
      const mockFetch = jest
        .spyOn(gateway, 'getRelayCount')
        .mockResolvedValue({ limit: 5, remaining: 3 })
        .mockRejectedValueOnce('Failed to fetch')
        .mockResolvedValueOnce({ limit: 5, remaining: 2 })

      renderHook(() => useLeastRemainingRelays(ownerAddresses))
      expect(mockFetch).toHaveBeenCalledTimes(0)
    })

    it('refetch if the txHistoryTag changes', () => {
      const mockFetch = jest.spyOn(gateway, 'getRelayCount')

      const render = renderHook(() => useLeastRemainingRelays(ownerAddresses))
      expect(mockFetch).toHaveBeenCalledTimes(3)

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: {
          txHistoryTag: 'new',
        },
        safeAddress: SAFE_ADDRESS,
      } as ReturnType<typeof useSafeInfo.default>)

      render.rerender()

      expect(mockFetch).toHaveBeenCalledTimes(6)
    })
  })
})
