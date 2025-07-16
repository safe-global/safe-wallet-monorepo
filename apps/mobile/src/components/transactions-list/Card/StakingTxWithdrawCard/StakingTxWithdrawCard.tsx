import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenAmount } from '@/src/components/TokenAmount'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenIcon } from '@/src/components/TokenIcon'

interface StakingTxWithdrawCardProps {
  info: NativeStakingWithdrawTransactionInfo
  onPress: () => void
}

export const StakingTxWithdrawCard = ({ info, onPress }: StakingTxWithdrawCardProps) => {
  return (
    <SafeListItem
      label={`Claim`}
      icon="transaction-stake"
      type={'Stake'}
      onPress={onPress}
      rightNode={
        <TokenAmount
          testID="token-amount"
          value={info.value}
          tokenSymbol={info.tokenInfo.symbol}
          decimals={info.tokenInfo.decimals}
        />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
