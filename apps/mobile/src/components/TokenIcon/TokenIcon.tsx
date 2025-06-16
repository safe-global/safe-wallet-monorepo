import React from 'react'
import { Logo } from '../Logo/Logo'
import { BadgeThemeTypes } from '../Logo/Logo'
import { IconProps } from '../SafeFontIcon/SafeFontIcon'
import { upgradeCoinGeckoThumbToQuality } from '@safe-global/utils/utils/image'

interface TokenIconProps {
  logoUri?: string | null
  accessibilityLabel?: string
  fallbackIcon?: IconProps['name']
  imageBackground?: string
  size?: string
  badgeContent?: React.ReactElement
  badgeThemeName?: BadgeThemeTypes
}

export function TokenIcon({
  logoUri,
  accessibilityLabel,
  size = '$10',
  imageBackground = '$color',
  fallbackIcon = 'token',
  badgeContent,
  badgeThemeName = 'badge_background',
}: TokenIconProps) {
  const optimizedLogoUri = React.useMemo(() => {
    return upgradeCoinGeckoThumbToQuality(logoUri, 'large')
  }, [logoUri])

  return (
    <Logo
      logoUri={optimizedLogoUri}
      accessibilityLabel={accessibilityLabel}
      size={size}
      imageBackground={imageBackground}
      fallbackIcon={fallbackIcon}
      badgeContent={badgeContent}
      badgeThemeName={badgeThemeName}
    />
  )
}
