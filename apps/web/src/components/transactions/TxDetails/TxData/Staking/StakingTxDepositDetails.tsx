import type {
  NativeStakingDepositTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Box } from '@mui/material'
import FieldsGrid from '@/components/tx/FieldsGrid'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import StakingConfirmationTxDeposit from './StakingConfirmationTxDeposit'

const StakingTxDepositDetails = ({
  info,
  txData,
}: {
  info: NativeStakingDepositTransactionInfo
  txData?: TransactionData | null
}) => {
  return (
    <Box
      sx={{
        pl: 1,
        pr: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {txData && (
        <SendAmountBlock title="Deposit" amountInWei={txData.value?.toString() || '0'} tokenInfo={info.tokenInfo} />
      )}
      <FieldsGrid title="Net reward rate">{info.annualNrr.toFixed(3)}%</FieldsGrid>
      <StakingConfirmationTxDeposit order={info} isTxDetails />
    </Box>
  )
}

export default StakingTxDepositDetails
