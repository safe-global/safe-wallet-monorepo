import { Transaction, VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'

interface VaultTxRedeemCardProps {
  bordered?: boolean
  inQueue?: boolean
  info: VaultRedeemTransactionInfo
  executionInfo?: Transaction['executionInfo']
  onPress?: () => void
}

export const VaultTxRedeemCard = ({ info, bordered, executionInfo, inQueue, onPress }: VaultTxRedeemCardProps) => {
  return (
    <SafeListItem
      label={'Withdraw'}
      icon="transaction-earn"
      type={'Earn'}
      onPress={onPress}
      bordered={bordered}
      executionInfo={executionInfo}
      inQueue={inQueue}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
