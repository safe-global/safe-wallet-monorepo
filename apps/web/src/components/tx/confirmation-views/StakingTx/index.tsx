import type { StakingTxInfo } from '@safe-global/store/gateway/types'
import { StakeFeature } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'
import type { NarrowConfirmationViewProps } from '../types'

export interface StakingTxProps extends NarrowConfirmationViewProps {
  txInfo: StakingTxInfo
}

function StakingTx({ txInfo }: StakingTxProps) {
  const stake = useLoadFeature(StakeFeature)
  return <stake.StakingConfirmationTx order={txInfo} />
}

export default StakingTx
