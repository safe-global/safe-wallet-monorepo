import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { StakingTxExitInfo } from '@safe-global/safe-gateway-typescript-sdk'

const StakingTxExitInfo = ({ info }: { info: StakingTxExitInfo }) => {
  return (
    <>
      {info.numValidators} Validator{maybePlural(info.numValidators)}
    </>
  )
}

export default StakingTxExitInfo
