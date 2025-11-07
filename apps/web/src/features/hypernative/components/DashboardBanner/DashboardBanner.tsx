import { Box, Button, Card, Typography } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import css from './styles.module.css'
import { dashboardBannerConfig } from './config'

export const DashboardBanner = () => {
  const { title, description, ctaLabel, href, badgeSrc, badgeAlt, tagLabel } = dashboardBannerConfig

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

          <Link href={href} passHref legacyBehavior>
            <Button variant="outlined" size="small" className={css.ctaButton}>
              {ctaLabel}
            </Button>
          </Link>
        </Box>
      </Box>
    </Card>
  )
}

export default DashboardBanner
