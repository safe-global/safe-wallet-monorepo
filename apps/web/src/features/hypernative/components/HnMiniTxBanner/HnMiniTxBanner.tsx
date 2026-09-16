import { X as CloseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Image from 'next/image'
import Track from '@/components/common/Track'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import css from './styles.module.css'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_SOURCE, MixpanelEventParams } from '@/services/analytics'

export interface HnMiniTxBannerProps extends WithHnSignupFlowProps {
  onDismiss: () => void
}

/**
 * Mini Hypernative banner component for transaction flows.
 * Compact, clickable banner that opens the Hypernative signup flow.
 * Uses the same custom background and theme as HnBanner.
 */
export const HnMiniTxBanner = ({ onHnSignupClick, onDismiss }: HnMiniTxBannerProps) => {
  const handleClick = () => {
    onHnSignupClick()
  }

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  return (
    <Track
      {...HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED}
      label={HYPERNATIVE_SOURCE.NewTransaction}
      mixpanelParams={{
        [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.NewTransaction,
      }}
    >
      <div className={css.banner} onClick={handleClick}>
        <div className={`flex flex-row items-center gap-3 ${css.bannerStack}`}>
          <Image
            className={css.bannerImage}
            src="/images/hypernative/guardian-badge.svg"
            alt="Guardian badge"
            width={32}
            height={32}
          />
          <div className={css.bannerContent}>
            <Typography variant="paragraph-small" className={css.bannerTitle}>
              Enforce enterprise-grade security
            </Typography>
            <Typography variant="paragraph-mini" className={css.bannerDescription}>
              Learn more
            </Typography>
          </div>
        </div>

        <Button variant="ghost" className={css.closeButton} aria-label="close" onClick={handleDismissClick}>
          <CloseIcon className={`${css.closeIcon} text-[var(--color-text-secondary)]`} />
        </Button>
      </div>
    </Track>
  )
}
