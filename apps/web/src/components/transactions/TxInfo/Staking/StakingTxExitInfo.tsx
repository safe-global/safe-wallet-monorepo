import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { maybePlural } from '@safe-global/utils/utils/formatters'

const StakingTxExitInfo = ({ info }: { info: NativeStakingValidatorsExitTransactionInfo }) => {
  return (
    <>
      {info.numValidators} Validator{maybePlural(info.numValidators)}
    </>
  )
}

export default StakingTxExitInfo
