import css from './styles.module.css'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Image, { type StaticImageData } from 'next/image'
import Link, { type LinkProps } from 'next/link'
import { X as CloseIcon } from 'lucide-react'
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react'

const DEFAULT_BACKGROUND = 'linear-gradient(90deg, #b0ffc9, #d7f6ff)'

export type PromoBannerViewProps = {
  title: string
  description?: string | ReactNode
  ctaLabel: string
  href?: LinkProps['href']
  imageSrc?: string | StaticImageData
  imageAlt?: string
  endIcon?: ReactNode
  customFontColor?: string
  customTitleColor?: string
  customCtaColor?: string
  customCloseIconColor?: string
  customBackground?: string
  ctaDisabled?: boolean
  ctaVariant?: 'text' | 'contained' | 'outlined'
  /** True when the CTA runs a callback rather than following `href` */
  hasCtaAction: boolean
  /** Makes the whole banner clickable */
  onBannerClick?: (e: MouseEvent) => void
  onCtaClick: (e: MouseEvent) => void
  onLinkClick: (e: MouseEvent) => void
  onDismiss?: (e: MouseEvent) => void
}

export function PromoBannerView({
  title,
  description,
  ctaLabel,
  href,
  imageSrc,
  imageAlt,
  endIcon,
  customFontColor,
  customTitleColor,
  customCtaColor,
  customCloseIconColor,
  customBackground,
  ctaDisabled,
  ctaVariant,
  hasCtaAction,
  onBannerClick,
  onCtaClick,
  onLinkClick,
  onDismiss,
}: PromoBannerViewProps): ReactElement {
  const bannerStyle: CSSProperties = {
    background: `${customBackground || DEFAULT_BACKGROUND}`,
    ...(onBannerClick ? { cursor: 'pointer' } : undefined),
  }

  const containedStyle: CSSProperties | undefined = customCtaColor ? { backgroundColor: customCtaColor } : undefined
  const textStyle: CSSProperties | undefined = customCtaColor ? { color: customCtaColor } : undefined

  return (
    <div
      className={css.banner}
      style={bannerStyle}
      onClick={onBannerClick}
      {...(onBannerClick ? { role: 'button' } : {})}
    >
      <div className={`flex flex-row gap-4 ${css.bannerStack}`}>
        {imageSrc ? (
          <Image className={css.bannerImage} src={imageSrc} alt={imageAlt || ''} width={95} height={95} />
        ) : null}
        <div className={css.bannerContent}>
          <Typography
            variant="h4"
            className={`${css.bannerText} ${css.bannerTitle}`}
            style={customTitleColor ? { color: customTitleColor } : undefined}
          >
            {title}
          </Typography>

          {description ? (
            <Typography
              as="div"
              variant="paragraph-small"
              className={`${css.bannerText} ${css.bannerDescription}`}
              style={customFontColor ? { color: customFontColor } : undefined}
            >
              {description}
            </Typography>
          ) : null}

          {hasCtaAction ? (
            <Button
              variant={ctaVariant === 'text' ? 'ghost' : ctaVariant === 'contained' ? 'default' : 'outline'}
              size="sm"
              onClick={onCtaClick}
              className={ctaVariant === 'text' ? css.bannerCtaText : css.bannerCtaContained}
              style={ctaVariant === 'text' ? textStyle : containedStyle}
              disabled={ctaDisabled}
            >
              {ctaLabel}
              {endIcon}
            </Button>
          ) : href ? (
            <Button
              variant="ghost"
              size="default"
              onClick={onLinkClick}
              className={css.bannerCtaText}
              style={textStyle}
              render={<Link href={href} />}
            >
              {ctaLabel}
              {endIcon}
            </Button>
          ) : (
            <Button variant="ghost" size="default" className={css.bannerCtaText} style={textStyle}>
              {ctaLabel}
              {endIcon}
            </Button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          className={css.closeButton}
          aria-label="close"
          onClick={onDismiss}
          style={customCloseIconColor ? { color: customCloseIconColor } : undefined}
        >
          <CloseIcon className={`size-6 ${css.closeIcon}`} />
        </button>
      )}
    </div>
  )
}
