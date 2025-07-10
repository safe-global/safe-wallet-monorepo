import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

export const StakingTxDepositCard = ({
  info,
  ...rest
}: {
  info: NativeStakingDepositTransactionInfo
} & Partial<SafeListItemProps>) => {
  return (
    <SafeListItem
      label={`Deposit`}
      icon="transaction-stake"
      type={'Stake'}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
      {...rest}
    />
  )
}
