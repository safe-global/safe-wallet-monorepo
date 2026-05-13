import { useMemo } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectDraftByHash } from '@/src/store/draftTxSlice'

/**
 * Resolves a transaction by id from either the local draft slice
 * (un-proposed transactions composed on this device) or CGW.
 *
 * The draft branch short-circuits before RTK Query is involved, so a
 * synthetic txId (the safeTxHash of a draft) never produces a network
 * request — avoiding the 404 that would otherwise overwrite the
 * synthesized details on refetch.
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
    // while keeping the rest of its API surface (status, isUninitialized,
    // refetch, etc.) for compatibility with all existing consumers.
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
    } as typeof query
  }, [draft, query])
}
