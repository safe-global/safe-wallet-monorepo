import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import VaultDepositConfirmation from '@/features/earn/components/VaultDepositConfirmation'
import { Box } from '@mui/material'
import FieldsGrid from '@/components/tx/FieldsGrid'
import TokenAmount from '@/components/common/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'

const VaultDepositTxDetails = ({ info }: { info: VaultDepositTransactionInfo }) => {
  const totalNrr = (info.baseNrr + info.additionalRewardsNrr) / 100

  return (
    <Box pl={1} pr={5} display="flex" flexDirection="column" gap={1}>
      <FieldsGrid title="Deposit">
        <TokenAmount
          tokenSymbol={info.tokenInfo.symbol}
          value={info.value}
          logoUri={info.tokenInfo.logoUri || ''}
          decimals={info.tokenInfo.decimals}
        />
      </FieldsGrid>
      <FieldsGrid title="Reward rate">{formatPercentage(totalNrr)}</FieldsGrid>
      <VaultDepositConfirmation txInfo={info} isTxDetails />
    </Box>
  )
}

export default VaultDepositTxDetails
