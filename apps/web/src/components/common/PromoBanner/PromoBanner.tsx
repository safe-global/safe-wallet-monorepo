import css from './styles.module.css'
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import Image, { type StaticImageData } from 'next/image'
import Link, { type LinkProps } from 'next/link'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import type { ReactNode } from 'react'
import type { AnalyticsEvent } from '@/services/analytics'

export interface PromoBannerProps {
  title: string
  description?: string
  ctaLabel: string
  href: LinkProps['href']
  trackOpenProps: AnalyticsEvent
  trackHideProps: AnalyticsEvent
  onDismiss?: () => void
  imageSrc?: string | StaticImageData
  imageAlt?: string
  endIcon?: ReactNode
  variant?: 'default' | 'dark'
  customClass?: string
}

export const PromoBanner = ({
  title,
  description,
  ctaLabel,
  href,
  onDismiss,
  imageSrc,
  imageAlt,
  endIcon,
  trackOpenProps,
  trackHideProps,
  variant = 'default',
  customClass
}: PromoBannerProps) => {

  const darkBackgroundGradient = 'linear-gradient(90deg, #1c5538 0%, #1c1c1c 54.327%, #1c1c1c 100%)'

  return (
    <Card
      className={`${css.banner} ${customClass || ''}`}
      style={{ borderRadius: '12px' }}
      sx={customClass ? { background: darkBackgroundGradient } : undefined}
    >
      <Stack
        direction={{ xs: 'row', md: 'row' }}
        alignItems="center"
        spacing={2}
        sx={{ display: 'inline-flex', flexWrap: 'nowrap' }}
      >
        {imageSrc ? (
          <Image className={css.bannerImage} src={imageSrc} alt={imageAlt || ''} width={95} height={95} />
        ) : null}
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            color={variant === 'dark' ? 'common.white' : 'static.main'}
            className={css.bannerText}
          >
            {title}
          </Typography>

          {description ? (
            <Typography variant="body2" color="primary.light" sx={{ pt: 0.5 }} className={css.bannerText}>
              {description}
            </Typography>
          ) : null}

          <Track {...trackOpenProps}>
            <Link href={href} passHref>
              <Button
                endIcon={endIcon ?? endIcon}
                variant="text"
                size="compact"
                sx={{ mt: 0, p: 0, pt: 1, color: variant === 'dark' ? 'common.white' : 'static.main' }}
                color="static"
              >
                {ctaLabel}
              </Button>
            </Link>
          </Track>
        </Box>
      </Stack>

      {onDismiss && (
        <Track {...trackHideProps}>
          <IconButton
            className={css.closeButton}
            aria-label="close"
            onClick={onDismiss}
            sx={{
              position: 'absolute',
              p: 1.25,
              pt: 1.5,
              width: 16,
              height: 16,
              '&:hover': { backgroundColor: 'transparent' },
            }}
          >
            <CloseIcon
              fontSize="medium"
              sx={{ color: variant === 'dark' ? 'common.white' : 'text.primary', opacity: 0.6 }} />
          </IconButton>
        </Track>
      )}
    </Card>
  )
}

export default PromoBanner
