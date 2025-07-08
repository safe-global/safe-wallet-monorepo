import { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type VaultTxRedeemCardProps = {
  info: VaultRedeemTransactionInfo
} & Partial<SafeListItemProps>

export const VaultTxRedeemCard = ({ info, ...rest }: VaultTxRedeemCardProps) => {
  return (
    <SafeListItem
      label={'Withdraw'}
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
