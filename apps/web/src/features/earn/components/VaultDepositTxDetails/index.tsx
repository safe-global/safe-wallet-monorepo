import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import VaultDepositConfirmation from '../VaultDepositConfirmation'
import FieldsGrid from '@/components/tx/FieldsGrid'
import TokenAmount from '@/components/common/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'

const VaultDepositTxDetails = ({ info }: { info: VaultDepositTransactionInfo }) => {
  const totalNrr = (info.baseNrr + info.additionalRewardsNrr) / 100

  return (
    <div className="flex flex-col gap-2 pl-2 pr-10">
      <FieldsGrid title="Deposit">
        <TokenAmount
          tokenSymbol={info.tokenInfo.symbol}
          value={info.value}
          logoUri={info.tokenInfo.logoUri || ''}
          decimals={info.tokenInfo.decimals}
        />
      </FieldsGrid>
      <FieldsGrid title="Earn (after fees)">{formatPercentage(totalNrr)}</FieldsGrid>
      <VaultDepositConfirmation txInfo={info} isTxDetails />
    </div>
  )
}

export default VaultDepositTxDetails
