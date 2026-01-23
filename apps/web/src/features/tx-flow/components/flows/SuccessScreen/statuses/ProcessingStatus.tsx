// Extract status handling into separate components
import { Box, Typography } from '@mui/material'
import { SpeedUpMonitor } from '@/features/speedup/components/SpeedUpMonitor'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'

type Props = {
  txId: string
  pendingTx: PendingTx
  willDeploySafe: boolean
}
export const ProcessingStatus = ({ txId, pendingTx, willDeploySafe: isCreatingSafe }: Props) => (
  <Box px={3} mt={3}>
    <Typography data-testid="transaction-status" variant="h6" mt={2} fontWeight={700}>
      {!isCreatingSafe ? 'Transaction is now processing' : 'Nested Safe is now being created'}
    </Typography>
    <Typography variant="body2" mb={3}>
      {!isCreatingSafe ? 'The transaction' : 'Your Nested Safe'} was confirmed and is now being processed.
    </Typography>
    <Box>
      {pendingTx.status === PendingStatus.PROCESSING && (
        <SpeedUpMonitor txId={txId} pendingTx={pendingTx} modalTrigger="alertBox" />
      )}
    </Box>
  </Box>
)
