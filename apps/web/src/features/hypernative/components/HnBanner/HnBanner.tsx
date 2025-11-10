import { PromoBanner } from '@/components/common/PromoBanner'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useAppDispatch } from '@/store'
import { setBannerDismissed } from '@/features/hypernative/store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'

export const hnBannerID = 'hnBanner'

export interface HnBannerProps extends WithHnSignupFlowProps {
  isDismissable?: boolean
}

export const HnBanner = ({ onHnSignupClick, isDismissable = true }: HnBannerProps) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleDismiss = () => {
    dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))
  }

  return (
    <PromoBanner
      // TODO: check tracking events naming
      trackOpenProps={{
        category: 'hypernative',
        action: 'open_hn_banner',
        label: 'Strengthen your Safe',
      }}
      trackHideProps={{
        category: 'hypernative',
        action: 'hide_hn_banner',
        label: 'Strengthen your Safe',
      }}
      title="Strengthen your Safe"
      description="Automatically monitor and block risky transactions using advanced, user-defined security policies by Hypernative."
      ctaLabel="Learn more"
      imageSrc="/images/hypernative/guardian-badge.svg"
      imageAlt="Guardian badge"
      onCtaClick={onHnSignupClick}
      ctaVariant="text"
      // Only passes the onDismiss prop when isDismissable is true:
      {...(isDismissable && { onDismiss: handleDismiss })}
      endIcon={<ArrowForwardIcon fontSize="small" />}
      customBackground="linear-gradient(90deg, #1c5538 0%, #1c1c1c 54.327%, #1c1c1c 100%)"
      customTitleColor="var(--color-static-primary)"
      customFontColor="#A1A3A7"
      customCtaColor="var(--color-static-primary)"
      customCloseIconColor="var(--color-text-secondary)"
    />
  )
}
