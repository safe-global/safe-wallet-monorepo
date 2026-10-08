import { usePendingTxIds } from '@/hooks/usePendingTxs'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { clearPendingTx } from '@/store/pendingTxsSlice'
import { useCallback } from 'react'
import { ClearPendingTxsView } from '@views/components/settings/ClearPendingTxs/ClearPendingTxsView'

export const ClearPendingTxs = () => {
  const pendingTxIds = usePendingTxIds()
  const pendingTxCount = pendingTxIds.length
  const dispatch = useAppDispatch()

  const clearPendingTxs = useCallback(() => {
    pendingTxIds.forEach((txId) => {
      dispatch(clearPendingTx({ txId }))
    })
    trackEvent({ ...SETTINGS_EVENTS.DATA.CLEAR_PENDING_TXS, label: pendingTxCount })
  }, [dispatch, pendingTxCount, pendingTxIds])
  return <ClearPendingTxsView pendingTxCount={pendingTxCount} onClear={clearPendingTxs} />
}
