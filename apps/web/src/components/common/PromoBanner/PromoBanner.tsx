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
  /**
   * Banner description text. Can be a plain string for simple text or a ReactNode for rich content
   * (e.g., text with inline links, formatted content).
   *
   * Note: When using ReactNode, ensure proper accessibility by using semantic HTML elements
   * and consider the impact on text wrapping and styling within the banner layout.
   */
  description?: string | ReactNode
  ctaLabel: string
  /**
   * Optional href for the CTA button. If not provided and onCtaClick is not set,
   * the CTA button will be rendered without a link wrapper.
   */
  href?: LinkProps['href']
  onCtaClick?: () => void
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
  ctaDisabled?: boolean
}

export const PromoBanner = ({
  title,
  description,
  ctaLabel,
  href,
  onCtaClick,
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
  ctaDisabled,
}: PromoBannerProps) => {
  return (
    <Card className={css.banner} sx={customBackground ? { background: `${customBackground} !important` } : undefined}>
      <Stack direction="row" spacing={2} className={css.bannerStack}>
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
            {onCtaClick ? (
              <Button
                {...(endIcon && { endIcon })}
                variant="contained"
                size="small"
                onClick={onCtaClick}
                className={css.bannerCtaContained}
                sx={customCtaColor ? { backgroundColor: `${customCtaColor} !important` } : undefined}
                disabled={ctaDisabled}
              >
                {ctaLabel}
              </Button>
            ) : href ? (
              <Link href={href} passHref>
                <Button
                  {...(endIcon && { endIcon })}
                  variant="text"
                  size="compact"
                  className={css.bannerCtaText}
                  sx={customCtaColor ? { color: `${customCtaColor} !important` } : undefined}
                  color={customCtaColor ? undefined : 'static'}
                >
                  {ctaLabel}
                </Button>
              </Link>
            ) : (
              <Button
                {...(endIcon && { endIcon })}
                variant="text"
                size="compact"
                className={css.bannerCtaText}
                sx={customCtaColor ? { color: `${customCtaColor} !important` } : undefined}
                color={customCtaColor ? undefined : 'static'}
              >
                {ctaLabel}
              </Button>
            )}
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
