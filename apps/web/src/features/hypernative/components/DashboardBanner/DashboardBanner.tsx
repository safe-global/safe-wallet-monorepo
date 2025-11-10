import { Box, Button, Card, Typography } from '@mui/material'
import Image from 'next/image'
import { useState } from 'react'
import css from './styles.module.css'
import { dashboardBannerConfig } from './config'
import { HnSignupFlow } from '../HnSignupFlow'

export const DashboardBanner = () => {
  const { title, description, ctaLabel, badgeSrc, badgeAlt, tagLabel } = dashboardBannerConfig
  const [isSignupFlowOpen, setIsSignupFlowOpen] = useState(false)

  const handleCtaClick = () => {
    setIsSignupFlowOpen(true)
  }

  const handleCloseSignupFlow = () => {
    setIsSignupFlowOpen(false)
  }

  return (
    <>
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

            <Button variant="outlined" size="small" className={css.ctaButton} onClick={handleCtaClick}>
              {ctaLabel}
            </Button>
          </Box>
        </Box>
      </Card>

      <HnSignupFlow open={isSignupFlowOpen} onClose={handleCloseSignupFlow} />
    </>
  )
}

export default DashboardBanner
