import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import useChains from '@/hooks/useChains'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import useClearPortfolioOnTx from '../useClearPortfolioOnTx'

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
})
