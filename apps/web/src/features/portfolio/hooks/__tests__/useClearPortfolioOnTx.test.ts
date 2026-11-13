import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { act, advanceClock, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import useChains from '@/hooks/useChains'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { portfolioSnapshotBuilder, portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { getStoreInstance } from '@/store'
import { setCurrency } from '@/store/settingsSlice'
import useClearPortfolioOnTx, { SETTLE_REFETCH_DELAY_MS, SETTLE_WINDOW_MAX_MS } from '../useClearPortfolioOnTx'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const SUMMARIES_CHAIN = '1'
const OTHER_CHAIN = '137'

const recordRequests = (clearStatus = 204) => {
  const clears: Array<{ address: string; chainId: string | null }> = []
  const summaries: Array<string | null> = []
  server.use(
    http.delete<{ address: string }>(`${GATEWAY_URL}/v1/portfolio/:address`, ({ request, params }) => {
      clears.push({ address: params.address, chainId: new URL(request.url).searchParams.get('chainId') })
      return new HttpResponse(null, { status: clearStatus })
    }),
    http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
      summaries.push(new URL(request.url).searchParams.get('safes'))
      return HttpResponse.json([])
    }),
  )
  return { clears, summaries }
}

const dispatchSuccess = (chainId: string, safeAddress: string) =>
  act(() => {
    txDispatch(TxEvent.SUCCESS, { chainId, safeAddress, txId: faker.string.uuid(), groupKey: faker.string.uuid() })
  })

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

describe('useClearPortfolioOnTx', () => {
  beforeEach(() => {
    jest.mocked(useChains).mockReturnValue({
      configs: [
        chainBuilder()
          .with({ chainId: SUMMARIES_CHAIN, features: [FEATURES.PORTFOLIO_SUMMARIES] })
          .build(),
        chainBuilder().with({ chainId: OTHER_CHAIN, features: [] }).build(),
      ],
    })
  })

  it('clears the executed Safe with its chainId, then refetches that Safe summary only', async () => {
    const { clears, summaries } = recordRequests()
    const safe = fakerChecksummedAddress()
    renderHook(() => useClearPortfolioOnTx())

    dispatchSuccess(SUMMARIES_CHAIN, safe)

    await waitFor(() => expect(summaries).toEqual([`${SUMMARIES_CHAIN}:${safe}`]))
    expect(clears).toEqual([{ address: safe, chainId: SUMMARIES_CHAIN }])
  })

  it('does not refetch the summary when the clear fails', async () => {
    const { clears, summaries } = recordRequests(422)
    renderHook(() => useClearPortfolioOnTx())

    dispatchSuccess(SUMMARIES_CHAIN, fakerChecksummedAddress())

    await waitFor(() => expect(clears).toHaveLength(1))
    await settle()
    expect(summaries).toEqual([])
  })

  it('does nothing on a chain without the flag', async () => {
    const { clears, summaries } = recordRequests()
    renderHook(() => useClearPortfolioOnTx())

    dispatchSuccess(OTHER_CHAIN, fakerChecksummedAddress())

    await settle()
    expect(clears).toEqual([])
    expect(summaries).toEqual([])
  })

  it('stops listening after unmount', async () => {
    const { clears } = recordRequests()
    const { unmount } = renderHook(() => useClearPortfolioOnTx())
    unmount()

    dispatchSuccess(SUMMARIES_CHAIN, fakerChecksummedAddress())

    await settle()
    expect(clears).toEqual([])
  })

  describe('once the post-tx snapshot settles', () => {
    const SETTLE_LIFETIME_MS = 120_000
    const REGULAR_LIFETIME_MS = 60 * 60_000

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const serveSnapshots = (lifetimeMs: number, serverOffsetMs = 0) => {
      const summaries: Array<{ safe: string; currency: string | null }> = []
      server.use(
        http.delete(`${GATEWAY_URL}/v1/portfolio/:address`, () => new HttpResponse(null, { status: 204 })),
        http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
          const params = new URL(request.url).searchParams
          const [chainId, safe] = (params.get('safes') ?? '').split(':')
          summaries.push({ safe, currency: params.get('currency') })
          const updatedAt = Date.now() + serverOffsetMs
          const snapshot = portfolioSnapshotBuilder()
            .with({
              updatedAt: new Date(updatedAt).toISOString(),
              expiresAt: new Date(updatedAt + lifetimeMs).toISOString(),
            })
            .build()
          return HttpResponse.json([portfolioSummaryBuilder().with({ chainId, address: safe, snapshot }).build()])
        }),
      )
      return summaries
    }

    const executeTx = async (safe: string) => {
      dispatchSuccess(SUMMARIES_CHAIN, safe)
      await advanceClock(0)
    }

    it('re-reads the summary once, 2 s after a short post-tx snapshot expires, and never again', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS)
      renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      expect(summaries).toHaveLength(1)

      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS - 1)
      expect(summaries).toHaveLength(1)

      await advanceClock(1)
      expect(summaries).toHaveLength(2)

      await advanceClock(REGULAR_LIFETIME_MS)
      expect(summaries).toHaveLength(2)
    })

    it('does not re-read a regular snapshot', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(REGULAR_LIFETIME_MS)
      renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      await advanceClock(REGULAR_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS)

      expect(summaries).toHaveLength(1)
    })

    it('times the re-read from the snapshot lifetime when the client clock differs from CGW', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS, SETTLE_WINDOW_MAX_MS)
      renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS)

      expect(summaries).toHaveLength(2)
    })

    it('drops the pending re-read on unmount', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS)
      const { unmount } = renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      unmount()
      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS)

      expect(summaries).toHaveLength(1)
    })

    it('keeps only the re-read of the latest tx when the same Safe executes again', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS)
      renderHook(() => useClearPortfolioOnTx())
      const secondTxAfterMs = SETTLE_LIFETIME_MS / 4

      await executeTx(safe)
      await advanceClock(secondTxAfterMs)
      await executeTx(safe)
      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS - secondTxAfterMs)
      expect(summaries).toHaveLength(2)

      await advanceClock(secondTxAfterMs)
      expect(summaries).toHaveLength(3)

      await advanceClock(REGULAR_LIFETIME_MS)
      expect(summaries).toHaveLength(3)
    })

    it('re-reads each Safe that executed a tx', async () => {
      const [safe, otherSafe] = [fakerChecksummedAddress(), fakerChecksummedAddress()]
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS)
      renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      await executeTx(otherSafe)
      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS)

      expect(summaries.map((summary) => summary.safe).sort()).toEqual([safe, safe, otherSafe, otherSafe].sort())
    })

    it('drops the pending re-read when the currency changes', async () => {
      const safe = fakerChecksummedAddress()
      const summaries = serveSnapshots(SETTLE_LIFETIME_MS)
      renderHook(() => useClearPortfolioOnTx())

      await executeTx(safe)
      act(() => {
        getStoreInstance().dispatch(setCurrency('eur'))
      })
      await advanceClock(SETTLE_LIFETIME_MS + SETTLE_REFETCH_DELAY_MS)

      expect(summaries).toHaveLength(1)
    })
  })
})
