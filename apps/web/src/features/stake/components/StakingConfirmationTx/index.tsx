import type { StakingTxInfo } from '@safe-global/store/gateway/AUTO_GENERATED/data-decoded'
import StakingConfirmationTxDeposit from '@/features/stake/components/StakingConfirmationTx/Deposit'
import StakingConfirmationTxExit from '@/features/stake/components/StakingConfirmationTx/Exit'
import StakingConfirmationTxWithdraw from '@/features/stake/components/StakingConfirmationTx/Withdraw'
import { isStakingTxDepositInfo, isStakingTxExitInfo, isStakingTxWithdrawInfo } from '@/utils/transaction-guards'

type StakingOrderConfirmationViewProps = {
  order: StakingTxInfo
}

const StrakingConfirmationTx = ({ order }: StakingOrderConfirmationViewProps) => {
  if (isStakingTxDepositInfo(order)) {
    return <StakingConfirmationTxDeposit order={order} />
  }

  if (isStakingTxExitInfo(order)) {
    return <StakingConfirmationTxExit order={order} />
  }

  if (isStakingTxWithdrawInfo(order)) {
    return <StakingConfirmationTxWithdraw order={order} />
  }

  return null
}

export default StrakingConfirmationTx
