import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Logo } from '@/src/components/Logo'

export const VaultTxDepositCard = ({ info }: { info: VaultDepositTransactionInfo }) => {
  return (
    <SafeListItem
      label={'Deposit'}
      icon="transaction-stake"
      type={'Earn'}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<Logo logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
