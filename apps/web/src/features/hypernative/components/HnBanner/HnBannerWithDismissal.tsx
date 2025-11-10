import { useAppDispatch } from '@/store'
import { setBannerDismissed } from '@/features/hypernative/store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnBanner } from './HnBanner'

export interface HnBannerWithDismissalProps extends WithHnSignupFlowProps {
  isDismissable?: boolean
}

/**
 * Wrapper component that adds dismissal logic to HnBanner.
 * Handles Redux store dispatch for banner dismissal.
 */
export const HnBannerWithDismissal = ({ onHnSignupClick, isDismissable = true }: HnBannerWithDismissalProps) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleDismiss = isDismissable
    ? () => {
        dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))
      }
    : undefined

  return <HnBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} />
}
