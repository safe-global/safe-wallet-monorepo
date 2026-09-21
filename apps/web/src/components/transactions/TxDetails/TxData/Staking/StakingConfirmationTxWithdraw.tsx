import type { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import FieldsGrid from '@/components/tx/FieldsGrid'
import TokenAmount from '@/components/common/TokenAmount'

type StakingOrderConfirmationViewProps = {
  order: NativeStakingWithdrawTransactionInfo
}

const StakingConfirmationTxWithdraw = ({ order }: StakingOrderConfirmationViewProps) => {
  return (
    <div className="flex flex-col gap-4">
      <FieldsGrid title="Receive">
        {' '}
        <TokenAmount
          value={order.value}
          tokenSymbol={order.tokenInfo.symbol}
          decimals={order.tokenInfo.decimals}
          logoUri={order.tokenInfo.logoUri}
        />
      </FieldsGrid>
    </div>
  )
}

export default StakingConfirmationTxWithdraw
