import type { MouseEvent } from 'react'
import { X as CloseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Image from 'next/image'
import Track from '@/components/common/Track'
import css from './styles.module.css'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export type HnMiniTxBannerViewProps = {
  mixpanelParams: Record<string, string>
  onClick: () => void
  onDismissClick: (e: MouseEvent) => void
}

export const HnMiniTxBannerView = ({ mixpanelParams, onClick, onDismissClick }: HnMiniTxBannerViewProps) => {
  return (
    <Track
      {...HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED}
      label={HYPERNATIVE_SOURCE.NewTransaction}
      mixpanelParams={mixpanelParams}
    >
      <div className={css.banner} onClick={onClick}>
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

        <Button variant="ghost" className={css.closeButton} aria-label="close" onClick={onDismissClick}>
          <CloseIcon className={`${css.closeIcon} text-[var(--color-text-secondary)]`} />
        </Button>
      </div>
    </Track>
  )
}
