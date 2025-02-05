import { renderHook, waitFor } from '@/src/tests/test-utils'
import { useMyAccounts } from './useMyAccounts'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock safe item
const mockSafeItem = {
  SafeInfo: {
    address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
    threshold: 1,
    owners: [{ value: '0x456' as `0x${string}` }],
    fiatTotal: '1000',
    chainId: '1',
    queued: 0,
  },
  chains: ['1'],
}

// Mock chain IDs selector
const mockChainIds = ['1', '5'] as const

jest.mock('@/src/store/chains', () => ({
  selectAllChainsIds: () => mockChainIds,
}))

// Mock Redux dispatch and selector
const mockDispatch = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => {
    if (selector.name === 'selectAllChainsIds') {
      return mockChainIds
    }
    return null
  },
}))

describe('useMyAccountsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    server.use(
      http.get(`${GATEWAY_URL}/v1/safes`, ({ request }) => {
        const url = new URL(request.url)
        const safes = url.searchParams.get('safes')?.split(',') || []

        return HttpResponse.json(
          safes.map((safe) => ({
            address: { value: '0x123', name: 'Test Safe' },
            chainId: safe.split(':')[0],
            threshold: 1,
            owners: [{ value: '0x456' }],
            fiatTotal: '1000',
            queued: 0,
          })),
        )
      }),
    )
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should fetch safe overview and update store', async () => {
    renderHook(() => useMyAccounts(mockSafeItem))

    // Wait for dispatch to be called
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled()
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'safes/updateSafeInfo',
        payload: expect.objectContaining({
          address: '0x123',
          item: expect.objectContaining({
            chains: ['1', '5'],
            SafeInfo: expect.objectContaining({
              fiatTotal: '2000', // Sum of both chain balances
            }),
          }),
        }),
      }),
    )
  })

  it('should not update store if no data is returned', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/safes`, () => {
        return HttpResponse.json([])
      }),
    )

    renderHook(() => useMyAccounts(mockSafeItem))

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/safes`, () => {
        return HttpResponse.error()
      }),
    )

    renderHook(() => useMyAccounts(mockSafeItem))

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })
})
