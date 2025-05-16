import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Logo } from '@/src/components/Logo'

export const StakingTxDepositCard = ({ info }: { info: NativeStakingDepositTransactionInfo }) => {
  return (
    <SafeListItem
      label={`Deposit`}
      icon="transaction-stake"
      type={'Stake'}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<Logo logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
