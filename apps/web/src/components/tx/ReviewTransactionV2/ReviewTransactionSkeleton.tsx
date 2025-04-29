import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Box } from '@mui/material'

const ReviewTransactionSkeleton = () => (
  <TxCard>
    <Box minHeight="38svh" display="flex" alignItems="center" justifyContent="center" mb={5}>
      <LoadingSpinner status={SpinnerStatus.PROCESSING} />
    </Box>
  </TxCard>
)

export default ReviewTransactionSkeleton
