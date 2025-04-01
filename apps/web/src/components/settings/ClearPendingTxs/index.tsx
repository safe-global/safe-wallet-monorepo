import { usePendingTxIds } from '@/hooks/usePendingTxs'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { clearPendingTx } from '@/store/pendingTxsSlice'
import { Stack, Typography, Box, Button, Alert } from '@mui/material'
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
    <Stack spacing={2}>
      <Typography>Clear this Safe Account&apos;s pending transactions.</Typography>
      <Alert severity="warning">
        <Typography>
          This action does not delete any transactions but only resets their local state. It does not stop any pending
          transactions from executing. If you want to cancel an execution, you have to do so in your connected wallet.
        </Typography>
      </Alert>
      <Box>
        {pendingTxCount > 0 ? (
          <Button
            variant="text"
            color="error"
            onClick={clearPendingTxs}
            sx={{ backgroundColor: ({ palette }) => palette.error.background }}
          >
            Clear {pendingTxCount} transaction{maybePlural(pendingTxCount)}
          </Button>
        ) : (
          <Typography variant="body2">No pending transactions</Typography>
        )}
      </Box>
    </Stack>
  )
}
