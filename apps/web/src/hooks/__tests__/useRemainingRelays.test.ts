import { renderHook, waitFor } from '@/tests/test-utils'
import { useLeastRemainingRelays, useRelaysBySafe } from '@/hooks/useRemainingRelays'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'

const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'

describe('fetch remaining relays hooks', () => {
  const mockChain = chainBuilder()
    .with({ features: [FEATURES.RELAYING], chainId: '1' })
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
    it('should not do a network request if chain does not support relay', async () => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ features: [] }).build())

      const { result } = renderHook(() => useRelaysBySafe())

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      expect(result.current[0]).toBeUndefined() // data should be undefined
      expect(result.current[1]).toBeUndefined() // error should be undefined
    })

    it('should fetch relay count for the current safe', async () => {
      const { result } = renderHook(() => useRelaysBySafe())

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      expect(result.current[0]).toEqual({ remaining: 5, limit: 5 })
    })

    it('refetch if the txHistoryTag changes', async () => {
      const { result, rerender } = renderHook(() => useRelaysBySafe())

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // First load complete
      })

      // Change the safe address to trigger a new query
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: {
          txHistoryTag: 'new',
        },
        safeAddress: '0x0000000000000000000000000000000000000002',
      } as ReturnType<typeof useSafeInfo.default>)

      rerender()

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // Second load complete
      })

      // Should still have data since we're using the default MSW handler
      expect(result.current[0]).toBeDefined()
      expect(result.current[0]).toEqual({ remaining: 5, limit: 5 })
    })
  })

  describe('useLeastRemainingRelays hook', () => {
    const ownerAddresses = ['0x00', '0x01', '0x02']

    it('should return the minimum number of relays among owners', async () => {
      // MSW will use the default handler which returns remaining: 5 for all addresses
      // We override for specific addresses to test the minimum logic
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x00`, () => {
          return HttpResponse.json({ remaining: 3, limit: 5 })
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x01`, () => {
          return HttpResponse.json({ remaining: 2, limit: 5 })
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x02`, () => {
          return HttpResponse.json({ remaining: 5, limit: 5 })
        }),
      )

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      expect(result.current[0]).toEqual({ remaining: 2, limit: 5 })
    })

    it('should return the owner with 0 relays if one of them has no remaining relays', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x00`, () => {
          return HttpResponse.json({ remaining: 0, limit: 5 })
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x01`, () => {
          return HttpResponse.json({ remaining: 5, limit: 5 })
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x02`, () => {
          return HttpResponse.json({ remaining: 3, limit: 5 })
        }),
      )

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      expect(result.current[0]).toEqual({ remaining: 0, limit: 5 })
    })

    it('should return default values if there is an error fetching the remaining relays', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x00`, () => {
          return HttpResponse.error()
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x01`, () => {
          return HttpResponse.json({ remaining: 2, limit: 5 })
        }),
        http.get(`${GATEWAY_URL}/v1/chains/1/relay/0x02`, () => {
          return HttpResponse.json({ remaining: 3, limit: 5 })
        }),
      )

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      // When an error occurs, the hook returns the default fallback
      expect(result.current[0]).toEqual({ remaining: 0, limit: 5 })
    })

    it('should not do a network request if chain does not support relay', async () => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ features: [] }).build())

      const { result } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should be false
      })

      expect(result.current[0]).toBeUndefined() // data should be undefined
      expect(result.current[1]).toBeUndefined() // error should be undefined
    })

    it('refetch if the txHistoryTag changes', async () => {
      const { result, rerender } = renderHook(() => useLeastRemainingRelays(ownerAddresses))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // First load complete
      })

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: {
          txHistoryTag: 'new',
        },
        safeAddress: SAFE_ADDRESS,
      } as ReturnType<typeof useSafeInfo.default>)

      rerender()

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // Second load complete
      })

      expect(result.current[0]).toBeDefined()
    })
  })
})
