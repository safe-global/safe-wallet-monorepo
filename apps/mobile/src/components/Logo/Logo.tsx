import React from 'react'
import { Avatar, AvatarImageProps, Theme, View } from 'tamagui'
import { IconProps, SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'
import { Badge } from '../Badge/Badge'
import { badgeTheme } from '../Badge/theme'

type BadgeThemeKeys = keyof typeof badgeTheme
type ExtractAfterUnderscore<T extends string> = T extends `${string}_${infer Rest}` ? Rest : never
export type BadgeThemeTypes = ExtractAfterUnderscore<BadgeThemeKeys>

// Local loading status type
type LoadingStatus = Parameters<Exclude<AvatarImageProps['onLoadingStatusChange'], undefined>>[0]

interface LogoProps {
  logoUri?: string | null
  accessibilityLabel?: string
  fallbackIcon?: IconProps['name']
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
  badgeContent,
  badgeThemeName = 'badge_background',
}: LogoProps) {
  const [status, setStatus] = React.useState<LoadingStatus>('idle')

  // Reset status when logoUri changes
  React.useEffect(() => {
    setStatus('idle')
  }, [logoUri])

  const shouldShowImage = logoUri && status !== 'error'

  return (
    <Theme name="logo">
      <View width={size}>
        <View position="absolute" top={-10} right={-10} zIndex={1}>
          {badgeContent && (
            <Badge themeName={badgeThemeName} content={badgeContent} circleSize="$6" circleProps={{ bordered: true }} />
          )}
        </View>

        <Avatar circular size={size}>
          {shouldShowImage && (
            <Avatar.Image
              testID="logo-image"
              backgroundColor={imageBackground}
              accessibilityLabel={accessibilityLabel}
              src={logoUri}
              onLoadingStatusChange={setStatus}
            />
          )}

          <Avatar.Fallback backgroundColor="$background">
            <View backgroundColor="$background" padding="$2" borderRadius={100}>
              <SafeFontIcon testID="logo-fallback-icon" name={fallbackIcon} color="$colorSecondary" />
            </View>
          </Avatar.Fallback>
        </Avatar>
      </View>
    </Theme>
  )
}
