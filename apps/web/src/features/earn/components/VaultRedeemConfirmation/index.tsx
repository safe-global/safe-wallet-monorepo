import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { vaultTypeToLabel } from '../../services/utils'
import { VaultRedeemConfirmationView } from '@views/features/earn/components/VaultRedeemConfirmation/VaultRedeemConfirmationView'

const VaultRedeemConfirmation = ({
  txInfo,
  isTxDetails = false,
}: {
  txInfo: VaultRedeemTransactionInfo
  isTxDetails?: boolean
}) => {
  return (
    <VaultRedeemConfirmationView
      txInfo={txInfo}
      isTxDetails={isTxDetails}
      vaultTypeLabel={vaultTypeToLabel[txInfo.type]}
    />
  )
}

export default VaultRedeemConfirmation
