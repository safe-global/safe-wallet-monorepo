import { faker } from '@faker-js/faker'
import { useState, type ReactElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, advanceClock, fakerChecksummedAddress, render, renderOnFakeClock, waitFor } from '@/tests/test-utils'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { createScopeStore, ScopePool, type ScopeTarget } from './scopePool'

let mockCachedNonce = 0

jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({
    initial,
    children,
  }: {
    initial: { chainId: string; safeAddress: string }
    children: ReactNode
  }) => {
    const { currentData } = jest
      .requireActual('@safe-global/store/gateway/AUTO_GENERATED/safes')
      .useSafesGetSafeV1Query(initial, { pollingInterval: 0 })
    const value = {
      scope: { ...initial, scopeKey: `${initial.chainId}:${initial.safeAddress}`, safe: currentData },
      setScope: () => {},
      clearScope: () => {},
    } as unknown as SafeScopeContextValue
    return <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
  },
}))

const chainId = '11155111'

const renderPool = (nextNonce: number | undefined, renderUi: (ui: ReactElement) => unknown = render) => {
  const safeAddress = fakerChecksummedAddress()
  const requests = jest.fn()
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}`, () => {
      requests()
      return HttpResponse.json({ address: { value: safeAddress }, chainId, nonce: mockCachedNonce })
    }),
  )
  const store = createScopeStore()
  let setNextNonce: (next: number | undefined) => void = () => {}
  const Harness = () => {
    const [next, setNext] = useState(nextNonce)
    setNextNonce = setNext
    const target: ScopeTarget = { scopeKey: `${chainId}:${safeAddress}`, chainId, safeAddress, nextNonce: next }
    return <ScopePool targets={[target]} store={store} />
  }
  renderUi(<Harness />)
  const rerenderWith = (next: number | undefined) => act(() => setNextNonce(next))
  return { requests, rerenderWith }
}

describe('ScopePool', () => {
  beforeEach(() => {
    mockCachedNonce = faker.number.int({ min: 1, max: 1000 })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('refetches the Safe info when the queue lists a later nonce as next', async () => {
    const { requests } = renderPool(mockCachedNonce + 1)

    await waitFor(() => expect(requests).toHaveBeenCalledTimes(2))
  })

  it('keeps refetching the Safe info until it catches up with the queue, then stops', async () => {
    jest.useFakeTimers()
    const queueNonce = mockCachedNonce + 1
    const { requests } = renderPool(queueNonce, renderOnFakeClock)

    await advanceClock(100)
    expect(requests).toHaveBeenCalledTimes(2)

    await advanceClock(POLLING_INTERVAL)
    expect(requests).toHaveBeenCalledTimes(3)

    mockCachedNonce = queueNonce
    await advanceClock(POLLING_INTERVAL)
    expect(requests).toHaveBeenCalledTimes(4)

    await advanceClock(POLLING_INTERVAL * 3)
    expect(requests).toHaveBeenCalledTimes(4)
  })

  it('refetches the Safe info when the next nonce moves past it after mount', async () => {
    const { requests, rerenderWith } = renderPool(mockCachedNonce)
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(1))

    rerenderWith(mockCachedNonce + 1)

    await waitFor(() => expect(requests).toHaveBeenCalledTimes(2))
  })

  it.each([
    ['matches', 0],
    ['is behind', -1],
  ])('does not refetch the Safe info when the queue next nonce %s it', async (_, offset) => {
    const { requests } = renderPool(mockCachedNonce + offset)

    await waitFor(() => expect(requests).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requests).toHaveBeenCalledTimes(1)
  })

  it('does not refetch the Safe info when the queue has no next transaction', async () => {
    const { requests } = renderPool(undefined)

    await waitFor(() => expect(requests).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requests).toHaveBeenCalledTimes(1)
  })
})
