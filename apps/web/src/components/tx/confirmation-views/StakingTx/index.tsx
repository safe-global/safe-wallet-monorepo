import type { StakingTxInfo } from '@safe-global/store/gateway/types'
import StrakingConfirmationTx from '@/features/stake/components/StakingConfirmationTx'
import type { NarrowConfirmationViewProps } from '../types'

export interface StakingTxProps extends NarrowConfirmationViewProps {
  txInfo: StakingTxInfo
}

function StakingTx({ txInfo }: StakingTxProps) {
  return <StrakingConfirmationTx order={txInfo} />
}

export default StakingTx
