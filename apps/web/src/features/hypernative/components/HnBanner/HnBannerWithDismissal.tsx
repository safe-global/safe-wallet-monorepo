import { useAppDispatch } from '@/store'
import { setBannerDismissed } from '../../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnBanner } from './HnBanner'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export interface HnBannerWithDismissalProps extends WithHnSignupFlowProps {
  isDismissable?: boolean
  label?: HYPERNATIVE_SOURCE
}

/**
 * Wrapper component that adds dismissal logic to HnBanner.
 * Handles Redux store dispatch for banner dismissal.
 */
export const HnBannerWithDismissal = ({ onHnSignupClick, isDismissable = true, label }: HnBannerWithDismissalProps) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleDismiss = isDismissable
    ? () => {
        dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))
      }
    : undefined

  return <HnBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} label={label} />
}
