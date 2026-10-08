import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import VaultRedeemConfirmation from '../VaultRedeemConfirmation'
import { VaultRedeemTxDetailsView } from '@views/features/earn/components/VaultRedeemTxDetails/VaultRedeemTxDetailsView'

const VaultRedeemTxDetails = ({ info }: { info: VaultRedeemTransactionInfo }) => {
  return <VaultRedeemTxDetailsView info={info} confirmation={<VaultRedeemConfirmation txInfo={info} isTxDetails />} />
}

export default VaultRedeemTxDetails
