import { http, HttpResponse, delay } from 'msw'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { safeAppBuilder } from '@/tests/builders/walletConnect'
import { useMatchingSafeApp } from '../useMatchingSafeApp'

const mockChainId = jest.fn(() => '1')
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => mockChainId(),
}))

const uniswap = safeAppBuilder()
  .with({ url: 'https://app.uniswap.org', chainIds: ['1'] })
  .build()

const serveSafeApps = (appsByChain: Record<string, SafeAppData[]>) => {
  const requests: { chainId: string; clientUrl: string | null }[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, async ({ params, request }) => {
      const chainId = params.chainId as string
      requests.push({ chainId, clientUrl: new URL(request.url).searchParams.get('clientUrl') })
      await delay(20)
      return HttpResponse.json(appsByChain[chainId] ?? [])
    }),
  )
  return requests
}

describe('useMatchingSafeApp', () => {
  beforeEach(() => {
    mockChainId.mockReturnValue('1')
  })

  it('fetches nothing and matches nothing without a dApp URL', async () => {
    const requests = serveSafeApps({ '1': [uniswap] })

    const { result } = renderHook(() => useMatchingSafeApp(undefined))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requests).toEqual([])
    expect(result.current).toEqual({ safeApp: undefined, isLoading: false })
  })

  it('matches the dApp against the current chain for this host', async () => {
    const requests = serveSafeApps({ '1': [uniswap] })

    const { result } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org/swap'))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.safeApp).toEqual(uniswap))
    expect(result.current.isLoading).toBe(false)
    expect(requests).toEqual([{ chainId: '1', clientUrl: window.location.origin }])
  })

  it('settles with no match when the dApp has no Safe App', async () => {
    serveSafeApps({ '1': [uniswap] })

    const { result } = renderHook(() => useMatchingSafeApp('https://app.aave.com'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.safeApp).toBeUndefined()
  })

  it('never matches against the previous chain while the new chain loads', async () => {
    serveSafeApps({ '1': [uniswap], '137': [] })
    const { result, rerender } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org'))
    await waitFor(() => expect(result.current.safeApp).toEqual(uniswap))

    mockChainId.mockReturnValue('137')
    rerender()

    expect(result.current).toEqual({ safeApp: undefined, isLoading: true })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.safeApp).toBeUndefined()
  })

  it('settles with no match when the lookup fails', async () => {
    server.use(http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, () => HttpResponse.json({}, { status: 500 })))

    const { result } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.safeApp).toBeUndefined()
  })

  it('fetches nothing without a chain', async () => {
    mockChainId.mockReturnValue('')
    const requests = serveSafeApps({ '1': [uniswap] })

    renderHook(() => useMatchingSafeApp('https://app.uniswap.org'))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requests).toEqual([])
  })
})
