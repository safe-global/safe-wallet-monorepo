import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/**
 * Refreshes the Safe overview cache (aggregated balances shown on the Space dashboard,
 * My accounts list, Safe selectors, …) once an executed transaction has been indexed.
 *
 * The single-Safe balance refreshes via the portfolio/balances endpoints, but the
 * overview endpoints have no polling or tag invalidation of their own, so without this
 * the aggregated balance would stay stale until a full page reload.
 */
const useInvalidateOverviewsOnTx = (): void => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    return txSubscribe(TxEvent.SUCCESS, () => {
      dispatch(gatewayApi.util.invalidateTags(['SafeOverviews']))
    })
  }, [dispatch])
}

export default useInvalidateOverviewsOnTx
