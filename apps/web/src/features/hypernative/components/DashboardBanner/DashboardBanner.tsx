import { Box, Button, Card, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import Link, { type LinkProps } from 'next/link'
import css from './styles.module.css'
import type { ReactNode } from 'react'

export interface DashboardBannerProps {
  title: string
  description: string
  ctaLabel: string
  href: LinkProps['href']
  badgeSrc: string
  badgeAlt: string
  tagLabel: string
  endIcon: ReactNode
}

export const DashboardBanner = ({
  title,
  description,
  ctaLabel,
  href,
  badgeSrc,
  badgeAlt,
  tagLabel,
  endIcon,
}: DashboardBannerProps) => {
  return (
    <Card className={css.banner}>
      <Box className={css.tag}>
        <Typography variant="body2" className={css.tagText}>
          {tagLabel}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} className={css.content}>
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
              endIcon={endIcon}
            >
              {ctaLabel}
            </Button>
          </Link>
        </Box>
      </Stack>
    </Card>
  )
}

export default DashboardBanner

