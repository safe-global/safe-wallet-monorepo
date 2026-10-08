import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import VaultDepositConfirmation from '../VaultDepositConfirmation'
import { VaultDepositTxDetailsView } from '@views/features/earn/components/VaultDepositTxDetails/VaultDepositTxDetailsView'

const VaultDepositTxDetails = ({ info }: { info: VaultDepositTransactionInfo }) => {
  return <VaultDepositTxDetailsView info={info} confirmation={<VaultDepositConfirmation txInfo={info} isTxDetails />} />
}

export default VaultDepositTxDetails
