import React from 'react'
import { Avatar, Theme, View } from 'tamagui'
import { IconProps, SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'
import { Badge } from '../Badge/Badge'
import { badgeTheme } from '../Badge/theme'
import useValidLogoUri from '@/src/hooks/useValidLogoUri'

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
  imageBackground = '$color',
  fallbackIcon = 'nft',
  fallbackContent,
  badgeContent,
  badgeThemeName = 'badge_background',
}: LogoProps) {
  const validUri = useValidLogoUri(logoUri)

  return (
    <Theme name="logo">
      <View width={size}>
        <View position="absolute" top={-10} right={-10} zIndex={1}>
          {badgeContent && (
            <Badge themeName={badgeThemeName} content={badgeContent} circleSize="$6" circleProps={{ bordered: true }} />
          )}
        </View>

        <Avatar circular size={size}>
          {validUri && (
            <Avatar.Image
              testID="logo-image"
              backgroundColor={imageBackground}
              accessibilityLabel={accessibilityLabel}
              source={{ uri: validUri }}
            />
          )}

          <Avatar.Fallback backgroundColor="$background">
            {fallbackContent || (
              <View
                backgroundColor="$background"
                borderRadius={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                height={size}
                width={size}
              >
                <SafeFontIcon testID="logo-fallback-icon" name={fallbackIcon} color="$colorSecondary" size={16} />
              </View>
            )}
          </Avatar.Fallback>
        </Avatar>
      </View>
    </Theme>
  )
}
