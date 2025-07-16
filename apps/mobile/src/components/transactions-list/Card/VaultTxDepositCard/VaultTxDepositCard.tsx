import { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type VaultTxDepositCardProps = {
  info: VaultDepositTransactionInfo
} & Partial<SafeListItemProps>

export const VaultTxDepositCard = ({ info, ...rest }: VaultTxDepositCardProps) => {
  return (
    <SafeListItem
      label={'Deposit'}
      icon="transaction-earn"
      type={'Earn'}
      rightNode={
        <TokenAmount value={info.value} tokenSymbol={info.tokenInfo.symbol} decimals={info.tokenInfo.decimals} />
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
      {...rest}
    />
  )
}
