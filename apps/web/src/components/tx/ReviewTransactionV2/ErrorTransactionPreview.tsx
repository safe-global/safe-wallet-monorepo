import TxCard from '@/components/tx-flow/common/TxCard'
import { Box, Typography } from '@mui/material'

const ErrorTransactionPreview = () => (
  <TxCard>
    <Box
      minHeight="38svh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      mb={5}
      data-testid="error-transaction-preview"
    >
      <Typography variant="body1" fontWeight={700}>
        Error loading preview. Please try again.
      </Typography>
    </Box>
  </TxCard>
)

export default ErrorTransactionPreview
