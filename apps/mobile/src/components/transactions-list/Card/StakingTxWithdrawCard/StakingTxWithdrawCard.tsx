import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenAmount } from '@/src/components/TokenAmount'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Logo } from '@/src/components/Logo'

export const StakingTxWithdrawCard = ({ info }: { info: NativeStakingWithdrawTransactionInfo }) => {
  return (
    <SafeListItem
      label={`Claim`}
      icon="transaction-stake"
      type={'Stake'}
      rightNode={
        <TokenAmount
          testID="token-amount"
          value={info.value}
          tokenSymbol={info.tokenInfo.symbol}
          decimals={info.tokenInfo.decimals}
        />
      }
      leftNode={<Logo logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
