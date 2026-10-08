import type { StaticImageData } from 'next/image'
import type { LinkProps } from 'next/link'
import type { ReactNode } from 'react'
import type { AnalyticsEvent } from '@/services/analytics'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { PromoBannerView } from '@views/components/common/PromoBanner/PromoBannerView'

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
  trackingEvents: AnalyticsEvent
  trackingParams?: AnalyticsEvent
  trackHideProps?: AnalyticsEvent
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
  /**
   * Optional variant for the CTA button when onCtaClick is provided.
   * Defaults to "contained" if not specified.
   */
  ctaVariant?: 'text' | 'contained' | 'outlined'
  // Optional callback for when the entire banner is clicked:
  onBannerClick?: () => void
}

const PromoBanner = ({
  title,
  description,
  ctaLabel,
  href,
  onCtaClick,
  onDismiss,
  onBannerClick,
  imageSrc,
  imageAlt,
  endIcon,
  trackingEvents,
  trackingParams,
  trackHideProps,
  customFontColor,
  customTitleColor,
  customCtaColor,
  customCloseIconColor,
  customBackground,
  ctaDisabled,
  ctaVariant,
}: PromoBannerProps) => {
  // Combined click handler for both banner and CTA button clicks
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger banner click if clicking on the close button
    const target = e.target as HTMLElement
    if (target.closest('[aria-label="close"]')) {
      return
    }

    // Extract label from trackingEvents and create trackingParams for Mixpanel if not provided
    const label = trackingEvents.label
    const mixpanelParams = trackingParams || (label ? { [MixpanelEventParams.SOURCE]: label } : undefined)

    // Track the event
    trackEvent(trackingEvents, mixpanelParams)

    // When onBannerClick is provided, use it for both banner and CTA clicks
    // Otherwise use onCtaClick for CTA button clicks
    const callback = onBannerClick || onCtaClick
    callback?.()
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Track dismiss event if configured
    if (trackHideProps) {
      trackEvent(trackHideProps)
    }

    onDismiss?.()
  }

  return (
    <PromoBannerView
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      href={href}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      endIcon={endIcon}
      customFontColor={customFontColor}
      customTitleColor={customTitleColor}
      customCtaColor={customCtaColor}
      customCloseIconColor={customCloseIconColor}
      customBackground={customBackground}
      ctaDisabled={ctaDisabled}
      ctaVariant={ctaVariant}
      hasCtaAction={Boolean(onCtaClick || onBannerClick)}
      onBannerClick={onBannerClick ? handleClick : undefined}
      onCtaClick={(e) => {
        if (onBannerClick) {
          e.stopPropagation()
        }
        handleClick(e)
      }}
      onLinkClick={handleClick}
      onDismiss={onDismiss ? handleDismiss : undefined}
    />
  )
}

export default PromoBanner
