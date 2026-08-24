import { renderHook, waitFor } from '@/tests/test-utils'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useGetProposedSafesQuery } from '../api/gateway'
import { MAX_DELEGATE_PAGES } from '../api/gateway/proposedSafes'

const mockedInitiate = jest.spyOn(cgwApi.endpoints.delegatesGetDelegatesV2, 'initiate')

type DelegatePageFixture = { results: { safe?: string | null }[]; next?: string | null }

/** `next` cursors are full URLs in CGW responses — the wrapper has to dig the cursor out of them. */
const nextPageUrl = (chainId: string, cursor: number) =>
  `https://safe-client.example/v2/chains/${chainId}/delegates?cursor=${cursor}`

const mockDelegates = (byChain: Record<string, DelegatePageFixture[] | Error>) => {
  mockedInitiate.mockImplementation(((arg: { chainId: string; cursor?: string }) => {
    const entry = byChain[arg.chainId]
    const queryAction = {
      unsubscribe: jest.fn(),
      unwrap:
        entry instanceof Error
          ? jest.fn().mockRejectedValue(entry)
          : jest.fn().mockResolvedValue(entry?.[arg.cursor ? Number(arg.cursor) : 0] ?? { results: [], next: null }),
    }
    return (() => queryAction) as never
  }) as never)
}

const page = (safes: (string | null)[], next?: string | null): DelegatePageFixture => ({
  results: safes.map((safe) => ({ safe })),
  next: next ?? null,
})

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
const SAFE_C = '0xCcCCCcccCCcCCCCCcCcccCcccCCCCcCcCcccCCcC'
const DELEGATE = '0x1111111111111111111111111111111111111111'

describe('getProposedSafes', () => {
  beforeEach(() => {
    mockedInitiate.mockReset()
  })

  it('maps every chain to the safes the delegate can propose for', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([SAFE_B, SAFE_C])] })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1', '137'], delegate: DELEGATE }))

    await waitFor(() => {
      expect(result.current.data).toEqual({ '1': [SAFE_A], '137': [SAFE_B, SAFE_C] })
    })
    expect(result.current.isError).toBe(false)
  })

  it('queries the delegates endpoint once per chain, with the delegate filter', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([])] })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1', '137'], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(mockedInitiate).toHaveBeenCalledTimes(2)
    expect(mockedInitiate).toHaveBeenCalledWith({ chainId: '1', delegate: DELEGATE, cursor: undefined })
    expect(mockedInitiate).toHaveBeenCalledWith({ chainId: '137', delegate: DELEGATE, cursor: undefined })
  })

  it('shares one cache entry for the same set of chains regardless of order', async () => {
    mockDelegates({ '1': [page([SAFE_A])], '137': [page([SAFE_B])] })

    const { result } = renderHook(() => ({
      forward: useGetProposedSafesQuery({ chainIds: ['1', '137'], delegate: DELEGATE }),
      reversed: useGetProposedSafesQuery({ chainIds: ['137', '1'], delegate: DELEGATE }),
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

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1', '137'], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A] }))
    expect(result.current.isError).toBe(false)
  })

  it('follows `next` cursors until the pages are exhausted', async () => {
    mockDelegates({ '1': [page([SAFE_A], nextPageUrl('1', 1)), page([SAFE_B], nextPageUrl('1', 2)), page([SAFE_C])] })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1'], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A, SAFE_B, SAFE_C] }))
    expect(mockedInitiate).toHaveBeenCalledTimes(3)
  })

  it('stops following cursors at the page cap so an endless `next` cannot hang the form', async () => {
    // Every page points at another one; only the cap ends the walk.
    const endless = Array.from({ length: MAX_DELEGATE_PAGES + 3 }, (_, index) =>
      page([SAFE_A], nextPageUrl('1', index + 1)),
    )
    mockDelegates({ '1': endless })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1'], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockedInitiate).toHaveBeenCalledTimes(MAX_DELEGATE_PAGES)
  })

  it('ignores delegate entries that carry no safe', async () => {
    mockDelegates({ '1': [page([null, SAFE_A])] })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1'], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({ '1': [SAFE_A] }))
  })

  it('resolves to an empty map without a request when there are no chains', async () => {
    mockDelegates({})

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: [], delegate: DELEGATE }))

    await waitFor(() => expect(result.current.data).toEqual({}))
    expect(mockedInitiate).not.toHaveBeenCalled()
  })

  it('resolves to an empty map without a request when there is no delegate', async () => {
    mockDelegates({ '1': [page([SAFE_A])] })

    const { result } = renderHook(() => useGetProposedSafesQuery({ chainIds: ['1'], delegate: '' }))

    await waitFor(() => expect(result.current.data).toEqual({}))
    expect(mockedInitiate).not.toHaveBeenCalled()
  })
})
