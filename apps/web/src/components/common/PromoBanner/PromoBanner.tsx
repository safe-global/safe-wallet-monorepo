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
  customFontColor?: string
  customTitleColor?: string
  customCtaColor?: string
  customCloseIconColor?: string
  customBackground?: string
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
  customFontColor,
  customTitleColor,
  customCtaColor,
  customCloseIconColor,
  customBackground,
}: PromoBannerProps) => {
  return (
    <Card className={css.banner} sx={customBackground ? { background: `${customBackground} !important` } : undefined}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} className={css.bannerStack}>
        {imageSrc ? (
          <Image className={css.bannerImage} src={imageSrc} alt={imageAlt || ''} width={95} height={95} />
        ) : null}
        <Box className={css.bannerContent}>
          <Typography
            variant="h4"
            className={`${css.bannerText} ${css.bannerTitle}`}
            sx={customTitleColor ? { color: `${customTitleColor} !important` } : undefined}
          >
            {title}
          </Typography>

          {description ? (
            <Typography
              variant="body2"
              className={`${css.bannerText} ${css.bannerDescription}`}
              sx={customFontColor ? { color: `${customFontColor} !important` } : undefined}
            >
              {description}
            </Typography>
          ) : null}

          <Track {...trackOpenProps}>
            <Link href={href} passHref>
              <Button
                {...(endIcon && { endIcon })}
                variant="text"
                size="compact"
                className={css.bannerCta}
                sx={customCtaColor ? { color: `${customCtaColor} !important` } : undefined}
                color={customCtaColor ? undefined : 'static'}
              >
                {ctaLabel}
              </Button>
            </Link>
          </Track>
        </Box>
      </Stack>

      {onDismiss && (
        <Track {...trackHideProps}>
          <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
            <CloseIcon
              fontSize="medium"
              className={css.closeIcon}
              sx={customCloseIconColor ? { color: `${customCloseIconColor} !important` } : undefined}
            />
          </IconButton>
        </Track>
      )}
    </Card>
  )
}

export default PromoBanner
