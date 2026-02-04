import type { StakingTxInfo } from '@safe-global/store/gateway/types'
import StakingConfirmationTxDeposit from '@/components/transactions/TxDetails/TxData/Staking/StakingConfirmationTxDeposit'
import StakingConfirmationTxExit from './Exit'
import StakingConfirmationTxWithdraw from '@/components/transactions/TxDetails/TxData/Staking/StakingConfirmationTxWithdraw'
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
