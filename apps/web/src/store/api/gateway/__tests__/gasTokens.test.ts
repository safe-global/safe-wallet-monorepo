import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { useGetGasTokensQuery } from '../index'
import { Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const GAS_TOKENS_URL = `${GATEWAY_URL}/v1/chains/11155111/fees/gas-tokens`

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe('getGasTokens', () => {
  beforeEach(() => {
    jest.mocked(logError).mockClear()
  })

  it('returns the accepted gas tokens of the chain', async () => {
    server.use(
      http.get(GAS_TOKENS_URL, () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            { address: DAI, symbol: 'DAI' },
            { address: USDC, symbol: 'USDC' },
          ],
        }),
      ),
    )

    const { result } = renderHook(() => useGetGasTokensQuery({ chainId: '11155111' }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { address: DAI, symbol: 'DAI' },
      { address: USDC, symbol: 'USDC' },
    ])
    expect(logError).not.toHaveBeenCalled()
  })

  it('returns an empty list for a chain with no gas tokens', async () => {
    server.use(http.get(GAS_TOKENS_URL, () => HttpResponse.json({ count: 0, next: null, previous: null, results: [] })))

    const { result } = renderHook(() => useGetGasTokensQuery({ chainId: '11155111' }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('reports a failed request as an error', async () => {
    server.use(http.get(GAS_TOKENS_URL, () => HttpResponse.json({ message: 'nope' }, { status: 500 })))

    const { result } = renderHook(() => useGetGasTokensQuery({ chainId: '11155111' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(Errors._660, expect.any(Error))
  })

  it('treats a response of the wrong shape as an error, not an empty list', async () => {
    server.use(http.get(GAS_TOKENS_URL, () => HttpResponse.json({ results: [{ address: 1 }] })))

    const { result } = renderHook(() => useGetGasTokensQuery({ chainId: '11155111' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(Errors._660, expect.any(Error))
  })
})
