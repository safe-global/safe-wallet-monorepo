import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import FieldsGrid from '@/components/tx/FieldsGrid'
import TokenAmount from '@/components/common/TokenAmount'
import VaultRedeemConfirmation from '../VaultRedeemConfirmation'

const VaultRedeemTxDetails = ({ info }: { info: VaultRedeemTransactionInfo }) => {
  return (
    <div className="flex flex-col gap-2 pl-2 pr-10">
      <FieldsGrid title="Withdraw">
        <TokenAmount
          tokenSymbol={info.tokenInfo.symbol}
          value={info.value}
          logoUri={info.tokenInfo.logoUri || ''}
          decimals={info.tokenInfo.decimals}
        />
      </FieldsGrid>
      <VaultRedeemConfirmation txInfo={info} isTxDetails />
    </div>
  )
}

export default VaultRedeemTxDetails
