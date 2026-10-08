import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { vaultTypeToLabel } from '../../services/utils'
import { BRAND_NAME } from '@/config/constants'
import { VaultDepositConfirmationView } from '@views/features/earn/components/VaultDepositConfirmation/VaultDepositConfirmationView'

const VaultDepositConfirmation = ({
  txInfo,
  isTxDetails = false,
}: {
  txInfo: VaultDepositTransactionInfo
  isTxDetails?: boolean
}) => {
  if (!txInfo.vaultInfo) return null

  return (
    <VaultDepositConfirmationView
      txInfo={txInfo}
      isTxDetails={isTxDetails}
      vaultTypeLabel={vaultTypeToLabel[txInfo.type]}
      brandName={BRAND_NAME}
    />
  )
}

export default VaultDepositConfirmation
