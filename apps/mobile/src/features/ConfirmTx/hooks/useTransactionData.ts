import { useMemo } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectDraftByHash } from '@/src/store/draftTxSlice'

/**
 * RTK Query's `refetch` ignores the `skip` option, so even when the
 * underlying query is skipped a caller can still trigger a real GET
 * /transactions/<id>. For drafts that would 404 and clobber the
 * synthesized data — we replace refetch with a no-op that mimics the
 * QueryActionCreatorResult shape consumers expect.
 */
const draftRefetchNoop = (() => {
  const promise = Promise.resolve(undefined) as unknown as ReturnType<
    ReturnType<typeof useTransactionsGetTransactionByIdV1Query>['refetch']
  >
  return () => promise
})()

/**
 * Resolves a transaction by id from either the local draft slice
 * (un-proposed transactions composed on this device) or CGW.
 *
 * The draft branch short-circuits before RTK Query is involved, so a
 * synthetic txId (the safeTxHash of a draft) never produces a network
 * request — neither on the initial fetch (via `skip`) nor on any
 * subsequent caller-triggered refetch (via the overridden no-op).
 */
export const useTransactionData = (txId: string) => {
  const activeSafe = useDefinedActiveSafe()
  const draft = useAppSelector((state) => selectDraftByHash(state, txId))

  const query = useTransactionsGetTransactionByIdV1Query(
    {
      chainId: activeSafe.chainId,
      id: txId,
    },
    {
      skip: !!draft || !txId || !activeSafe?.chainId,
    },
  )

  return useMemo(() => {
    if (!draft) {
      return query
    }
    // Override the RTK Query result with the synthetic draft details
    // while keeping the rest of its API surface (status, isUninitialized
    // etc.) for compatibility with all existing consumers. `refetch`
    // is replaced because the RTK one ignores `skip`.
    return {
      ...query,
      data: draft.txDetails,
      currentData: draft.txDetails,
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      isUninitialized: false,
      error: undefined,
      refetch: draftRefetchNoop,
    } as typeof query
  }, [draft, query])
}
