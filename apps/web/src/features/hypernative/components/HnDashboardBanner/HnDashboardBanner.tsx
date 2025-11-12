import { Box, Button, Card, Typography } from '@mui/material'
import Image from 'next/image'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import css from './styles.module.css'
import { dashboardBannerConfig } from './config'
import Track from '@/components/common/Track'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_SOURCE } from '@/services/analytics'

export interface HnDashboardBannerProps extends WithHnSignupFlowProps {}

export const HnDashboardBanner = ({ onHnSignupClick }: HnDashboardBannerProps) => {
  const { title, description, ctaLabel, badgeSrc, badgeAlt, tagLabel } = dashboardBannerConfig

  return (
    <Card className={css.banner}>
      <Box className={css.tag}>
        <Typography variant="body2" className={css.tagText}>
          {tagLabel}
        </Typography>
      </Box>

      <Box className={css.content}>
        <Box className={css.badgeContainer}>
          <Image src={badgeSrc} alt={badgeAlt} width={54} height={54} className={css.badge} />
        </Box>

        <Box className={css.textContent}>
          <Typography variant="h6" className={css.title}>
            {title}
          </Typography>

          <Typography variant="body2" className={css.description}>
            {description}
          </Typography>

          <Track
            {...HYPERNATIVE_EVENTS.GUARD_LEARN_MORE}
            mixpanelParams={{ source: HYPERNATIVE_SOURCE.AccountCreation }}
          >
            <Button variant="outlined" size="small" className={css.ctaButton} onClick={onHnSignupClick}>
              {ctaLabel}
            </Button>
          </Track>
        </Box>
      </Box>
    </Card>
  )
}
