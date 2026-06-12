import { usePendingTxIds } from '@/hooks/usePendingTxs'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { clearPendingTx } from '@/store/pendingTxsSlice'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { useCallback } from 'react'

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
  return (
    <div className="flex flex-col gap-4">
      <Typography>Clear this Safe Account&apos;s pending transactions.</Typography>
      <Alert variant="warning">
        <AlertDescription>
          This action does not delete any transactions but only resets their local state. It does not stop any pending
          transactions from executing. If you want to cancel an execution, you have to do so in your connected wallet.
        </AlertDescription>
      </Alert>
      <div>
        {pendingTxCount > 0 ? (
          <Button variant="destructive" onClick={clearPendingTxs}>
            Clear {pendingTxCount} transaction{maybePlural(pendingTxCount)}
          </Button>
        ) : (
          <Typography variant="paragraph-small">No pending transactions</Typography>
        )}
      </div>
    </div>
  )
}
