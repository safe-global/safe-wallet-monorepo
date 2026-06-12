import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Image from 'next/image'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import css from './styles.module.css'
import { dashboardBannerConfig } from './config'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_SOURCE, trackEvent, MixpanelEventParams } from '@/services/analytics'

export interface HnDashboardBannerProps extends WithHnSignupFlowProps {}

export const HnDashboardBanner = ({ onHnSignupClick }: HnDashboardBannerProps) => {
  const { title, description, ctaLabel, badgeSrc, badgeAlt, tagLabel } = dashboardBannerConfig

  const handleBannerClick = () => {
    trackEvent(
      { ...HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED, label: HYPERNATIVE_SOURCE.Tutorial },
      { [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Tutorial },
    )
    onHnSignupClick()
  }

  return (
    <div className={`cursor-pointer ${css.banner}`} onClick={handleBannerClick} role="button">
      <div className={css.tag}>
        <Typography variant="paragraph-small" className={css.tagText}>
          {tagLabel}
        </Typography>
      </div>

      <div className={css.content}>
        <div className={css.badgeContainer}>
          <Image src={badgeSrc} alt={badgeAlt} width={54} height={54} className={css.badge} />
        </div>

        <div className={css.textContent}>
          <Typography variant="h4" className={css.title}>
            {title}
          </Typography>

          <Typography variant="paragraph-small" className={css.description}>
            {description}
          </Typography>

          <Button variant="outline" size="sm" className={css.ctaButton}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
