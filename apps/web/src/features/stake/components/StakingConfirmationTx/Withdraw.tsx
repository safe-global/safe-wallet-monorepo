import type { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Stack } from '@mui/material'
import FieldsGrid from '@/components/tx/FieldsGrid'
import TokenAmount from '@/components/common/TokenAmount'

type StakingOrderConfirmationViewProps = {
  order: NativeStakingWithdrawTransactionInfo
}

const StakingConfirmationTxWithdraw = ({ order }: StakingOrderConfirmationViewProps) => {
  return (
    <Stack
      sx={{
        gap: 2,
      }}
    >
      <FieldsGrid title="Receive">
        {' '}
        <TokenAmount
          value={order.value}
          tokenSymbol={order.tokenInfo.symbol}
          decimals={order.tokenInfo.decimals}
          logoUri={order.tokenInfo.logoUri}
        />
      </FieldsGrid>
    </Stack>
  )
}

export default StakingConfirmationTxWithdraw
