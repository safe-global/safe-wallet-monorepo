// Extract status handling into separate components
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { SpeedUpMonitor } from '@/features/speedup/components/SpeedUpMonitor'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'

type Props = {
  txId: string
  pendingTx: PendingTx
}
export const ProcessingStatus = ({ txId, pendingTx }: Props) => (
  <Box
    sx={{
      paddingX: 3,
      mt: 3,
    }}
  >
    <Typography
      data-testid="transaction-status"
      variant="h6"
      sx={{
        marginTop: 2,
        fontWeight: 700,
      }}
    >
      Transaction is now processing
    </Typography>
    <Typography
      variant="body2"
      sx={{
        mb: 3,
      }}
    >
      The transaction was confirmed and is now being processed.
    </Typography>
    <Box>
      {pendingTx.status === PendingStatus.PROCESSING && (
        <SpeedUpMonitor txId={txId} pendingTx={pendingTx} modalTrigger="alertBox" />
      )}
    </Box>
  </Box>
)
