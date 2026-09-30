import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenAmount } from '@/src/components/TokenAmount'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenIcon } from '@/src/components/TokenIcon'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type StakingTxWithdrawCardProps = {
  info: NativeStakingWithdrawTransactionInfo
  onPress: () => void
} & Partial<SafeListItemProps>

export const StakingTxWithdrawCard = ({ info, onPress, ...rest }: StakingTxWithdrawCardProps) => {
  return (
    <SafeListItem
      label={`Claim`}
      icon="transaction-stake"
      type={'Stake'}
      onPress={onPress}
      {...rest}
      rightNode={
        <TokenAmount
          testID="token-amount"
          value={info.value}
          tokenSymbol={info.tokenInfo.symbol}
          decimals={info.tokenInfo.decimals}
        />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} size="$8" />}
    />
  )
}
