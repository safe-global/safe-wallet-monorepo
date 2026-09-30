import type { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import StakingConfirmationTxWithdraw from './StakingConfirmationTxWithdraw'

const StakingTxWithdrawDetails = ({ info }: { info: NativeStakingWithdrawTransactionInfo }) => {
  return (
    <div className="flex flex-col gap-2 pl-2 pr-10">
      <StakingConfirmationTxWithdraw order={info} />
    </div>
  )
}

export default StakingTxWithdrawDetails
