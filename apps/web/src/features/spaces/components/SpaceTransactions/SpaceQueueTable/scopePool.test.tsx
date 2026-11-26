import { faker } from '@faker-js/faker'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { server } from '@/tests/server'
import { act, advanceClock, fakerChecksummedAddress, render, renderOnFakeClock } from '@/tests/test-utils'
import { hasActiveScope } from '@safe-global/views/components/tx-flow/safe-scope/activeScope'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'
import { createScopeStore, ScopePool, type ScopeTarget } from './scopePool'

describe('ScopePool', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false })
  })

  it('does not arm the URL-Safe SDK guard, so flows opened on the URL Safe still work', () => {
    const chainId = faker.string.numeric(5)
    const safeAddress = faker.finance.ethereumAddress()
    const targets = [{ scopeKey: buildSafeScopeKey(chainId, safeAddress), chainId, safeAddress }]

    render(<ScopePool targets={targets} store={createScopeStore()} />)

    expect(hasActiveScope()).toBe(false)
  })

  describe('when the queue lists a next nonce', () => {
    const chainId = '11155111'
    let servedNonce: number

    const renderPool = async (nextNonce: number | undefined) => {
      const safeAddress = fakerChecksummedAddress()
      const requests = jest.fn()
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}`, () => {
          requests()
          return HttpResponse.json(
            safeInfoBuilder()
              .with({
                chainId,
                address: { value: safeAddress },
                implementation: addressExBuilder().build(),
                nonce: servedNonce,
              })
              .build(),
          )
        }),
      )
      const store = createScopeStore()
      let setNextNonce: (next: number | undefined) => void = () => {}
      const Harness = () => {
        const [next, setNext] = useState(nextNonce)
        setNextNonce = setNext
        const target: ScopeTarget = {
          scopeKey: buildSafeScopeKey(chainId, safeAddress),
          chainId,
          safeAddress,
          nextNonce: next,
        }
        return <ScopePool targets={[target]} store={store} />
      }
      renderOnFakeClock(<Harness />)
      await advanceClock(100)
      const moveNextNonce = (next: number | undefined) => act(() => setNextNonce(next))
      return { requests, moveNextNonce }
    }

    beforeEach(() => {
      servedNonce = faker.number.int({ min: 1, max: 1000 })
    })

    it('refetches the Safe info when the queue is ahead of it', async () => {
      const { requests } = await renderPool(servedNonce + 1)

      expect(requests).toHaveBeenCalledTimes(2)
    })

    it('refetches the Safe info when the next nonce moves past it after mount', async () => {
      const { requests, moveNextNonce } = await renderPool(servedNonce)
      expect(requests).toHaveBeenCalledTimes(1)

      moveNextNonce(servedNonce + 1)
      await advanceClock(100)

      expect(requests).toHaveBeenCalledTimes(2)
    })

    it('keeps refetching the Safe info until it catches up with the queue, then stops', async () => {
      const queueNonce = servedNonce + 1
      const { requests } = await renderPool(queueNonce)
      expect(requests).toHaveBeenCalledTimes(2)

      await advanceClock(POLLING_INTERVAL)
      expect(requests).toHaveBeenCalledTimes(3)

      servedNonce = queueNonce
      await advanceClock(POLLING_INTERVAL)
      expect(requests).toHaveBeenCalledTimes(4)

      await advanceClock(POLLING_INTERVAL * 3)
      expect(requests).toHaveBeenCalledTimes(4)
    })

    it.each([
      ['matches it', 0],
      ['is behind it', -1],
    ])('does not refetch the Safe info when the queue next nonce %s', async (_, offset) => {
      const { requests } = await renderPool(servedNonce + offset)

      await advanceClock(POLLING_INTERVAL * 2)

      expect(requests).toHaveBeenCalledTimes(1)
    })

    it('does not refetch the Safe info when the queue has no next transaction', async () => {
      const { requests } = await renderPool(undefined)

      await advanceClock(POLLING_INTERVAL * 2)

      expect(requests).toHaveBeenCalledTimes(1)
    })
  })
})
