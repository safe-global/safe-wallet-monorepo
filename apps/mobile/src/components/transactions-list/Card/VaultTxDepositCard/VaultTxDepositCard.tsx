import { Transaction, VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'

interface VaultTxDepositCardProps {
  bordered?: boolean
  inQueue?: boolean
  info: VaultDepositTransactionInfo
  executionInfo?: Transaction['executionInfo']
  onPress?: () => void
}

export const VaultTxDepositCard = ({ info, onPress, bordered, inQueue, executionInfo }: VaultTxDepositCardProps) => {
  return (
    <SafeListItem
      label={'Deposit'}
      icon="transaction-earn"
      type={'Earn'}
      onPress={onPress}
      bordered={bordered}
      inQueue={inQueue}
      executionInfo={executionInfo}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
