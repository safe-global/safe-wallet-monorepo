import { Box, Button, Card, Typography } from '@mui/material'
import Image from 'next/image'
import Link, { type LinkProps } from 'next/link'
import css from './styles.module.css'

export interface DashboardBannerProps {
  title: string
  description: string
  ctaLabel: string
  href: LinkProps['href']
  badgeSrc: string
  badgeAlt: string
  tagLabel: string
}

export const DashboardBanner = ({
  title,
  description,
  ctaLabel,
  href,
  badgeSrc,
  badgeAlt,
  tagLabel,
}: DashboardBannerProps) => {
  return (
    <Card className={css.banner}>
      <Box className={css.tag}>
        <Typography variant="body2" className={css.tagText}>
          {tagLabel}
        </Typography>
      </Box>

      <Box className={css.content}>
        <Box className={css.badgeContainer}>
          <Image
            src={badgeSrc}
            alt={badgeAlt}
            width={54}
            height={54}
            className={css.badge}
          />
        </Box>

        <Box className={css.textContent}>
          <Typography variant="h6" className={css.title}>
            {title}
          </Typography>

          <Typography variant="body2" className={css.description}>
            {description}
          </Typography>

          <Link href={href} passHref legacyBehavior>
            <Button
              variant="outlined"
              size="small"
              className={css.ctaButton}
            >
              {ctaLabel}
            </Button>
          </Link>
        </Box>
      </Box>
    </Card>
  )
}

export default DashboardBanner

