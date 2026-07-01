import type { ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
import { Box, Button } from '@mui/material'
import { TicketPercent } from 'lucide-react'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

type UpsellBannerProps = {
  children: ReactNode
  ctaLabel: string
  ctaHref: string
  onCtaClick?: () => void
  elevation?: 'md' | 'lg'
  'data-testid'?: string
}

export const UpsellBanner = ({
  children,
  ctaLabel,
  ctaHref,
  onCtaClick,
  elevation = 'lg',
  'data-testid': testId,
}: UpsellBannerProps): ReactElement => (
  <Box className={cn(css.banner, elevation === 'md' ? css.elevationMd : css.elevationLg)} data-testid={testId}>
    <Box aria-hidden className={css.glow} />

    <Box className={css.iconBadge}>
      <TicketPercent size={16} />
    </Box>

    <Box className={css.content}>{children}</Box>

    <Button
      variant="contained"
      component={NextLink}
      href={ctaHref}
      onClick={onCtaClick}
      className={css.ctaButton}
      data-testid="upsell-banner-cta"
    >
      {ctaLabel}
    </Button>
  </Box>
)
