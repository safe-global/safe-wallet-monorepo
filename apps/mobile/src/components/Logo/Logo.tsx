import React, { useState } from 'react'
import { Theme, View } from 'tamagui'
import { Image } from 'expo-image'
import { IconProps, SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'
import { Badge } from '../Badge/Badge'
import { badgeTheme } from '../Badge/theme'

type BadgeThemeKeys = keyof typeof badgeTheme
type ExtractAfterUnderscore<T extends string> = T extends `${string}_${infer Rest}` ? Rest : never
export type BadgeThemeTypes = ExtractAfterUnderscore<BadgeThemeKeys>

interface LogoProps {
  logoUri?: string | null
  accessibilityLabel?: string
  fallbackIcon?: IconProps['name']
  fallbackContent?: React.ReactNode
  imageBackground?: string
  size?: string
  badgeContent?: React.ReactElement
  badgeThemeName?: BadgeThemeTypes
}

export function Logo({
  logoUri,
  accessibilityLabel,
  size = '$10',
  imageBackground = '$background',
  fallbackIcon = 'nft',
  fallbackContent,
  badgeContent,
  badgeThemeName = 'badge_background',
}: LogoProps) {
  const [showFallback, setShowFallback] = useState(false)

  const displayFallback = showFallback || !logoUri

  return (
    <Theme name="logo">
      <View width={size}>
        <View position="absolute" top={-10} right={-10} zIndex={1}>
          {badgeContent && (
            <Badge themeName={badgeThemeName} content={badgeContent} circleSize="$6" circleProps={{ bordered: true }} />
          )}
        </View>

        <View backgroundColor={imageBackground} width={size} height={size} borderRadius="50%">
          {logoUri && !showFallback && (
            <Image
              testID="logo-image"
              source={logoUri}
              style={{
                flex: 1,
                borderRadius: 50,
              }}
              accessibilityLabel={accessibilityLabel}
              onError={() => setShowFallback(true)}
            />
          )}
          {displayFallback &&
            (fallbackContent || (
              <View
                backgroundColor="$background"
                borderRadius="50%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                height={size}
                width={size}
              >
                <SafeFontIcon testID="logo-fallback-icon" name={fallbackIcon} color="$colorSecondary" size={16} />
              </View>
            ))}
        </View>
      </View>
    </Theme>
  )
}
