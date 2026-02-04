import { useAppDispatch } from '@/store'
import { setBannerDismissed } from '../../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnMiniTxBanner } from './HnMiniTxBanner'

export interface HnMiniTxBannerWithDismissalProps extends WithHnSignupFlowProps {}

/**
 * Wrapper component that adds dismissal logic to HnMiniTxBanner.
 * Handles Redux store dispatch for banner dismissal.
 */
export const HnMiniTxBannerWithDismissal = ({ onHnSignupClick }: HnMiniTxBannerWithDismissalProps) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleDismiss = () => {
    dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))
  }

  return <HnMiniTxBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} />
}
