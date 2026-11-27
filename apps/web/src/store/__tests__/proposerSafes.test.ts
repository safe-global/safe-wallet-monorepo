import { renderHook, waitFor } from '@/tests/test-utils'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useGetProposerSafesQuery } from '../api/gateway'
import { DELEGATE_PAGE_CURSOR, MAX_DELEGATE_PAGES } from '../api/gateway/proposerSafes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'

const mockedInitiate = jest.spyOn(cgwApi.endpoints.delegatesGetDelegatesV2, 'initiate')
const mockedInitiateV3 = jest.spyOn(cgwApi.endpoints.delegatesGetDelegatesV3, 'initiate')

const chain = (chainId: string, features: FEATURES[] = []) => chainBuilder().with({ chainId, features }).build()

type DelegatePageFixture = { results: { safe?: string | null }[]; next?: string | null }

/** `next` cursors are full URLs in CGW responses — the wrapper has to dig the cursor out of them. */
const nextPageUrl = (chainId: string, cursor: number) =>
  `https://safe-client.example/v2/chains/${chainId}/delegates?cursor=${cursor}`

/** First request carries the pinned cursor; later ones carry the index from `next`. */
const pageIndex = (cursor?: string) => (!cursor || cursor === DELEGATE_PAGE_CURSOR ? 0 : Number(cursor))

const mockDelegates = (byChain: Record<string, DelegatePageFixture[] | Error>) => {
  const initiate = (arg: { chainId: string; cursor?: string }) => {
    const entry = byChain[arg.chainId]
    const queryAction = {
      unsubscribe: jest.fn(),
      unwrap:
        entry instanceof Error
          ? jest.fn().mockRejectedValue(entry)
          : jest.fn().mockResolvedValue(entry?.[pageIndex(arg.cursor)] ?? { results: [], next: null }),
    }
    return (() => queryAction) as never
  }
  mockedInitiate.mockImplementation(initiate as never)
  mockedInitiateV3.mockImplementation(initiate as never)
}

const page = (safes: (string | null)[], next?: string | null): DelegatePageFixture => ({
  results: safes.map((safe) => ({ safe })),
  next: next ?? null,
})

const FORCE_REFETCH = { forceRefetch: true }

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
const SAFE_C = '0xCcCCCcccCCcCCCCCcCcccCcccCCCCcCcCcccCCcC'
const DELEGATE = '0x1111111111111111111111111111111111111111'

describe('getProposerSafes', () => {
  beforeEach(() => {
    mockedInitiate.mockReset()
    mockedInitiateV3.mockReset()
  })

  it('maps every chain to the safes the delegate can propose for', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([SAFE_B, SAFE_C])] })

    const { result } = renderHook(() =>
      useGetProposerSafesQuery({ chains: [chain('1'), chain('137')], delegate: DELEGATE }),
    )

    await waitFor(() => {
      expect(result.current.data).toEqual({ '1': [SAFE_A], '137': [SAFE_B, SAFE_C] })
    })
    expect(result.current.isError).toBe(false)
  })

  it('queries the delegates endpoint once per chain, with the delegate filter', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([])] })

    const { result } = renderHook(() =>
      useGetProposerSafesQuery({ chains: [chain('1'), chain('137')], delegate: DELEGATE }),
    )

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(mockedInitiate).toHaveBeenCalledTimes(2)
    expect(mockedInitiate).toHaveBeenCalledWith(
      { chainId: '1', delegate: DELEGATE, cursor: DELEGATE_PAGE_CURSOR },
      FORCE_REFETCH,
    )
    expect(mockedInitiate).toHaveBeenCalledWith(
      { chainId: '137', delegate: DELEGATE, cursor: DELEGATE_PAGE_CURSOR },
      FORCE_REFETCH,
    )
  })

  it('lists delegates from the queue service on chains with QUEUE_SERVICE and the transaction service elsewhere', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([SAFE_B])] })

    const { result } = renderHook(() =>
      useGetProposerSafesQuery({ chains: [chain('1', [FEATURES.QUEUE_SERVICE]), chain('137')], delegate: DELEGATE }),
    )

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A], '137': [SAFE_B] }))
    expect(mockedInitiateV3).toHaveBeenCalledTimes(1)
    expect(mockedInitiateV3).toHaveBeenCalledWith(
      { chainId: '1', delegate: DELEGATE, cursor: DELEGATE_PAGE_CURSOR },
      FORCE_REFETCH,
    )
    expect(mockedInitiate).toHaveBeenCalledTimes(1)
    expect(mockedInitiate).toHaveBeenCalledWith(
      { chainId: '137', delegate: DELEGATE, cursor: DELEGATE_PAGE_CURSOR },
      FORCE_REFETCH,
    )
  })

  it('keeps a separate cache entry when a chain switches to the queue service', async () => {
    mockDelegates({ '1': [page([SAFE_A])] })

    const { result } = renderHook(() => ({
      transactionService: useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }),
      queueService: useGetProposerSafesQuery({ chains: [chain('1', [FEATURES.QUEUE_SERVICE])], delegate: DELEGATE }),
    }))

    await waitFor(() => {
      expect(result.current.transactionService.data).toBeDefined()
      expect(result.current.queueService.data).toBeDefined()
    })
    expect(mockedInitiate).toHaveBeenCalledTimes(1)
    expect(mockedInitiateV3).toHaveBeenCalledTimes(1)
  })

  it('pins the first page size so the page cap is a known ceiling', async () => {
    mockDelegates({ '1': [page([SAFE_A])] })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(DELEGATE_PAGE_CURSOR).toContain('limit=')
    expect(mockedInitiate).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: DELEGATE_PAGE_CURSOR }),
      FORCE_REFETCH,
    )
  })

  it('bypasses the inner cache so a retry sees freshly granted proposer rights', async () => {
    mockDelegates({ '1': [page([SAFE_A])] })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockedInitiate).toHaveBeenCalledWith(expect.anything(), FORCE_REFETCH)
  })

  it('shares one cache entry for the same set of chains regardless of order', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([SAFE_B])] })

    const { result } = renderHook(() => ({
      forward: useGetProposerSafesQuery({ chains: [chain('1'), chain('137')], delegate: DELEGATE }),
      reversed: useGetProposerSafesQuery({ chains: [chain('137'), chain('1')], delegate: DELEGATE }),
    }))

    await waitFor(() => {
      expect(result.current.forward.data).toEqual({ '1': [SAFE_A], '137': [SAFE_B] })
      expect(result.current.reversed.data).toEqual({ '1': [SAFE_A], '137': [SAFE_B] })
    })

    // Two chains, one fetch each — the reversed args must not mint a second cache entry.
    expect(mockedInitiate).toHaveBeenCalledTimes(2)
  })

  it('omits a chain whose delegates request failed and keeps the rest', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': new Error('Service unavailable') })

    const { result } = renderHook(() =>
      useGetProposerSafesQuery({ chains: [chain('1'), chain('137')], delegate: DELEGATE }),
    )

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A] }))
    expect(result.current.isError).toBe(false)
  })

  it('follows `next` cursors until the pages are exhausted', async () => {
    mockDelegates({ '1': [page([SAFE_A], nextPageUrl('1', 1)), page([SAFE_B], nextPageUrl('1', 2)), page([SAFE_C])] })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A, SAFE_B, SAFE_C] }))
    expect(mockedInitiate).toHaveBeenCalledTimes(3)
  })

  it('stops following cursors at the page cap so an endless `next` cannot hang the form', async () => {
    // Every page points at another one; only the cap ends the walk.
    const endless = Array.from({ length: MAX_DELEGATE_PAGES + 3 }, (_, index) =>
      page([SAFE_A], nextPageUrl('1', index + 1)),
    )
    mockDelegates({ '1': endless })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockedInitiate).toHaveBeenCalledTimes(MAX_DELEGATE_PAGES)
  })

  it('ignores delegate entries that carry no safe', async () => {
    mockDelegates({ '1': [page([null, SAFE_A])] })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A] }))
  })

  it('resolves to an empty map without a request when there are no chains', async () => {
    mockDelegates({})

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({}))
    expect(mockedInitiate).not.toHaveBeenCalled()
  })

  it('resolves to an empty map without a request when there is no delegate', async () => {
    mockDelegates({ '1': [page([SAFE_A])] })

    const { result } = renderHook(() => useGetProposerSafesQuery({ chains: [chain('1')], delegate: '' }))

    await waitFor(() => expect(result.current.data).toEqual({}))
    expect(mockedInitiate).not.toHaveBeenCalled()
  })
})
