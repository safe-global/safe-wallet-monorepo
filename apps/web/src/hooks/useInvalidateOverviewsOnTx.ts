import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { gatewayApi, makeSafeOverviewTag } from '@/store/api/gateway'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/**
 * Refreshes the Safe overview cache (aggregated balances shown on the Space dashboard,
 * My accounts list, Safe selectors, …) once an executed transaction has been indexed.
 *
 * The single-Safe balance refreshes via the portfolio/balances endpoints, but the
 * overview endpoints have no polling or tag invalidation of their own, so without this
 * the aggregated balance would stay stale until a full page reload.
 *
 * Invalidation is scoped to the executing Safe (chainId:address) so a tx only refetches
 * the overview queries that actually contain that Safe, not every mounted overview query.
 */
const useInvalidateOverviewsOnTx = (): void => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    return txSubscribe(TxEvent.SUCCESS, ({ chainId, safeAddress }) => {
      dispatch(
        gatewayApi.util.invalidateTags([{ type: 'SafeOverviews', id: makeSafeOverviewTag(chainId, safeAddress) }]),
      )
    })
  }, [dispatch])
}

export default useInvalidateOverviewsOnTx
