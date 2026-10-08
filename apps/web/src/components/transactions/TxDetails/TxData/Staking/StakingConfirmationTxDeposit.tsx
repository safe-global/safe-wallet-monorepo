import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { BRAND_NAME } from '@/config/constants'
import { StakingConfirmationTxDepositView } from '@views/components/transactions/TxDetails/TxData/Staking/StakingConfirmationTxDepositView'

type StakingOrderConfirmationViewProps = {
  order: NativeStakingDepositTransactionInfo
  isTxDetails?: boolean
}

const StakingConfirmationTxDeposit = ({ order, isTxDetails }: StakingOrderConfirmationViewProps) => {
  return <StakingConfirmationTxDepositView order={order} isTxDetails={isTxDetails} brandName={BRAND_NAME} />
}

export default StakingConfirmationTxDeposit
