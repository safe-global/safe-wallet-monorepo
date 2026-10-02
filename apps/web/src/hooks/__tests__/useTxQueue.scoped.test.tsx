import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { renderHook, waitFor, fakerChecksummedAddress } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { getMockTx } from '@/tests/mocks/transactions'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue, SafeScopeTarget } from '@/components/tx-flow/safe-scope/types'
import useTxQueue, { useQueuedTxByNonce } from '../useTxQueue'
import usePreviousNonces from '../usePreviousNonces'

const QUEUE_URL = `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`

const scopeWrapper = (target?: SafeScopeTarget) => {
  const value: SafeScopeContextValue = {
    scope: target
      ? { ...target, scopeKey: `${target.chainId}:${target.safeAddress}`, safeLoaded: true, safeLoading: false }
      : undefined,
    setScope: jest.fn(),
    clearScope: jest.fn(),
  }
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
  )
  return Wrapper
}

const storedQueue = (nonces: number[]) => ({
  txQueue: { data: { results: nonces.map((nonce) => getMockTx({ nonce })) }, loading: false, loaded: true },
})

describe('useTxQueue inside a Safe scope', () => {
  const target = { chainId: faker.string.numeric(3), safeAddress: fakerChecksummedAddress() }
  let requests: { chainId: string; safeAddress: string }[]

  beforeEach(() => {
    requests = []
    server.use(
      http.get<{ chainId: string; safeAddress: string }>(QUEUE_URL, ({ params }) => {
        requests.push({ chainId: params.chainId, safeAddress: params.safeAddress })
        const page: QueuedItemPage = { results: [getMockTx({ nonce: 227 }), getMockTx({ nonce: 228 })] }
        return HttpResponse.json(page)
      }),
    )
  })

  it("returns the scoped Safe's queue instead of the route Safe's stored queue", async () => {
    const { result } = renderHook(() => usePreviousNonces(), {
      wrapper: scopeWrapper(target),
      initialReduxState: storedQueue([5, 6]),
    })

    await waitFor(() => expect(result.current).toEqual([227, 228]))
    expect(requests).toEqual([target])
  })

  it('finds queued transactions by nonce in the scoped queue', async () => {
    const { result } = renderHook(() => useQueuedTxByNonce(228), {
      wrapper: scopeWrapper(target),
      initialReduxState: storedQueue([228]),
    })

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].transaction.executionInfo).toEqual(expect.objectContaining({ nonce: 228 }))
  })

  it('shares one request between every caller for the same Safe', async () => {
    const { result } = renderHook(
      () => ({ queue: useTxQueue(), first: useQueuedTxByNonce(227), second: useQueuedTxByNonce(228) }),
      { wrapper: scopeWrapper(target) },
    )

    await waitFor(() => expect(result.current.second).toHaveLength(1))
    expect(result.current.first).toHaveLength(1)
    expect(requests).toHaveLength(1)
  })

  it("never falls back to the route Safe's stored queue before a Safe is picked", () => {
    const { result } = renderHook(() => ({ nonces: usePreviousNonces(), byNonce: useQueuedTxByNonce(5) }), {
      wrapper: scopeWrapper(),
      initialReduxState: storedQueue([5]),
    })

    expect(result.current.nonces).toEqual([])
    expect(result.current.byNonce).toEqual([])
    expect(requests).toHaveLength(0)
  })
})

describe('useTxQueue outside a Safe scope', () => {
  it('reads the stored queue without fetching', () => {
    const requests: string[] = []
    server.use(
      http.get(QUEUE_URL, ({ request }) => {
        requests.push(request.url)
        return HttpResponse.json({ results: [] })
      }),
    )

    const { result } = renderHook(() => ({ nonces: usePreviousNonces(), byNonce: useQueuedTxByNonce(6) }), {
      initialReduxState: storedQueue([5, 6]),
    })

    expect(result.current.nonces).toEqual([5, 6])
    expect(result.current.byNonce).toHaveLength(1)
    expect(requests).toHaveLength(0)
  })
})
