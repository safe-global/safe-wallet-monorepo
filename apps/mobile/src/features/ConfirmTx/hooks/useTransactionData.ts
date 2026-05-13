import { useMemo } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectDraftByHash } from '@/src/store/draftTxSlice'

/**
 * Resolves a transaction by id from either the local draft slice
 * (un-proposed transactions composed on this device) or CGW.
 *
 * CGW is always queried — it resolves transactions by safeTxHash, so
 * a draft on this device may correspond to a tx already proposed by a
 * cosigner from another device. When CGW returns data, it is
 * authoritative and overrides the local draft. Otherwise we fall
 * back to the synthesized draft so the review screens render
 * normally during compose.
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
    // No local draft → standard query behaviour.
    if (!draft) {
      return query
    }
    // Server has data for this id → server wins.
    if (query.data) {
      return query
    }
    // Otherwise present the synthesized draft. The query is still
    // in-flight or has 404'd; we suppress its error/loading state so
    // the screens see a fulfilled result with the draft details.
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
