import { useMemo } from 'react'
import { QueryStatus } from '@reduxjs/toolkit/query'
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
 * directly. The draft fallback below is therefore only hit while the
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
    // The query is still in-flight or has 404'd; we synthesize a
    // fulfilled-shape result so the screens see consistent state.
    // `satisfies` constrains us to a real subset of the query result
    // shape — if RTK Query adds a required field, this stops compiling.
    const override = {
      data: draft.txDetails,
      currentData: draft.txDetails,
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      isUninitialized: false,
      error: undefined,
      status: QueryStatus.fulfilled,
    } satisfies Partial<typeof query>
    return { ...query, ...override } as typeof query
  }, [draft, query])
}
