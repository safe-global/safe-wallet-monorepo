import type { StakingTxInfo } from '@safe-global/store/gateway/types'
import type { NarrowConfirmationViewProps } from '../types'
import StakingConfirmationTx from '@/features/stake/public/components/StakingConfirmationTx'

export interface StakingTxProps extends NarrowConfirmationViewProps {
  txInfo: StakingTxInfo
}

function StakingTx({ txInfo }: StakingTxProps) {
  return <StakingConfirmationTx order={txInfo} />
}

export default StakingTx
