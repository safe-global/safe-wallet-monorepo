import { useMemo } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectDraftByHash } from '@/src/store/draftTxSlice'

/**
 * Resolves a transaction by id from either the local draft slice
 * (un-proposed transactions composed on this device) or CGW.
 *
 * The draft slice's extraReducer drops a draft as soon as CGW
 * confirms the transaction, so by the time `query.data` is set the
 * draft is already gone and this hook returns the query result
 * directly. The draft branch below is therefore only hit while the
 * server has no record of the tx (compose phase, or transient 404
 * between propose and the cache invalidation).
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
      skip: !txId || !activeSafe?.chainId,
    },
  )

  return useMemo(() => {
    if (!draft) {
      return query
    }
    // Synthesized fallback while the server has no record of the tx.
    // The query is still in-flight or has 404'd; we suppress its
    // error/loading state so the screens see a fulfilled result.
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
    } as unknown as typeof query
  }, [draft, query])
}
