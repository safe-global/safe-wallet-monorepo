import { renderHook, waitFor } from '@/src/tests/test-utils'
import { useBalances } from './useBalances'
import { http, HttpResponse } from 'msw'
import { server } from '@/src/tests/server'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock active safe selector using a mutable variable
let mockActiveSafe: { chainId: string; address: string } | null = {
  chainId: '1',
  address: '0x123',
}

jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: () => mockActiveSafe,
}))

describe('useBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns balances from the API', async () => {
    const balances = { fiatTotal: '10', items: [] }
    mockActiveSafe = { chainId: '1', address: '0x123' }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:fiatCode`, () => {
        return HttpResponse.json(balances)
      }),
    )

    const { result } = renderHook(() => useBalances())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.balances).toEqual(balances)
    expect(result.current.error).toBeUndefined()
  })

  it('skips query when there is no active safe', async () => {
    mockActiveSafe = null

    const { result } = renderHook(() => useBalances())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.balances).toBeUndefined()
  })
})
