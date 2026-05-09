import type { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Box } from '@mui/material'
import StakingConfirmationTxWithdraw from './StakingConfirmationTxWithdraw'

const StakingTxWithdrawDetails = ({ info }: { info: NativeStakingWithdrawTransactionInfo }) => {
  return (
    <Box pl={1} pr={5} display="flex" flexDirection="column" gap={1}>
      <StakingConfirmationTxWithdraw order={info} />
    </Box>
  )
}

export default StakingTxWithdrawDetails
