import { useScanForNewNetworks } from '../useScanForNewNetworks'
import { renderHook, act } from '@/src/tests/test-utils'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/src/config/constants'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Address } from '@/src/types/address'

const mockTrackEvent = jest.fn()
jest.mock('@/src/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

const mockChainIds = ['1', '137', '42161']
jest.mock('@/src/store/chains', () => ({
  selectAllChainsIds: () => mockChainIds,
}))

const safeAddress = faker.finance.ethereumAddress() as Address

const buildOverview = (chainId: string): SafeOverview => ({
  address: { value: safeAddress, name: null, logoUri: null },
  chainId,
  threshold: 1,
  owners: [],
  fiatTotal: '0',
  queued: 0,
  awaitingConfirmation: null,
})

const initialStoreWithKnownChain = {
  safes: {
    [safeAddress]: {
      '1': buildOverview('1'),
    },
  },
}

describe('useScanForNewNetworks', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
    server.resetHandlers()
  })

  it('starts in idle phase with no result', () => {
    const { result } = renderHook(() => useScanForNewNetworks(safeAddress), initialStoreWithKnownChain)

    expect(result.current.phase).toBe('idle')
    expect(result.current.lastResult).toBeNull()
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.isPressable).toBe(true)
  })

  it('reports newly discovered chains by diffing the response payload against known chains', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        // Backend returns the safe on chains 1 and 137; we know about 1, so 137 is new.
        return HttpResponse.json([buildOverview('1'), buildOverview('137')])
      }),
    )

    const { result } = renderHook(() => useScanForNewNetworks(safeAddress), initialStoreWithKnownChain)

    await act(async () => {
      await result.current.scan()
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.lastResult?.newChainIds).toEqual(['137'])
    expect(result.current.errorMessage).toBeNull()
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ eventLabel: 'success:1' }))
  })

  it('reports an empty result when no new chains are discovered', async () => {
    server.use(http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([buildOverview('1')])))

    const { result } = renderHook(() => useScanForNewNetworks(safeAddress), initialStoreWithKnownChain)

    await act(async () => {
      await result.current.scan()
    })

    expect(result.current.lastResult?.newChainIds).toEqual([])
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ eventLabel: 'empty' }))
  })

  it('transitions to error phase on a failed request and surfaces a message', async () => {
    server.use(http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json({ message: 'rate limit' }, { status: 429 })))

    const { result } = renderHook(() => useScanForNewNetworks(safeAddress), initialStoreWithKnownChain)

    await act(async () => {
      await result.current.scan()
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.errorMessage).not.toBeNull()
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ eventLabel: 'error' }))
  })
})
