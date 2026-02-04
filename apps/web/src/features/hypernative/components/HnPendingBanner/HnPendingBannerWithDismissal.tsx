import { useAppDispatch } from '@/store'
import { setPendingBannerDismissed } from '../../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnPendingBanner } from './HnPendingBanner'
import type { ReactElement } from 'react'

export interface HnPendingBannerWithDismissalProps extends WithHnSignupFlowProps {
  isDismissable?: boolean
}

/**
 * Wrapper component that adds dismissal logic to HnPendingBanner.
 * Handles Redux store dispatch for pending banner dismissal.
 */
export const HnPendingBannerWithDismissal = ({
  onHnSignupClick,
  isDismissable = true,
}: HnPendingBannerWithDismissalProps): ReactElement => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleDismiss = isDismissable
    ? () => {
        dispatch(setPendingBannerDismissed({ chainId, safeAddress, dismissed: true }))
      }
    : undefined

  return <HnPendingBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} />
}
