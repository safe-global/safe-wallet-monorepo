import React, { useState } from 'react'
import { Image } from 'expo-image'
import { SvgUri } from 'react-native-svg'
import { View, YStack } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { BadgeThemeTypes } from '@/src/components/Badge/Badge'

type Props = {
  url?: string
  size?: number
  circle?: boolean
  badgeContent?: React.ReactElement
  badgeThemeName?: BadgeThemeTypes
}

// dApp metadata icons come in both raster (png/jpg/webp) and SVG. Tamagui's Image (RN Image)
// and expo-image can't render SVG, so route SVG URLs through react-native-svg's SvgUri.
// Detection is by extension — SVGs served without one (common behind CDNs) fail to load in
// expo-image, which triggers onError and falls back to the placeholder below, same as any
// other broken icon URL.
const isSvgUrl = (url?: string): boolean => !!url && /\.svg($|\?|#)/i.test(url)

export const DappIcon: React.FC<Props> = ({ url, size = 64, circle = false, badgeContent, badgeThemeName }) => {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !url || failed

  const image = showPlaceholder ? (
    <YStack
      width={size}
      height={size}
      borderRadius={circle ? size : '$3'}
      backgroundColor="$backgroundSecondary"
      testID="dapp-icon-placeholder"
    />
  ) : isSvgUrl(url) ? (
    <SvgUri uri={url} width={size} height={size} onError={() => setFailed(true)} />
  ) : (
    <Image
      source={url}
      style={{ width: size, height: size }}
      contentFit="contain"
      onError={() => setFailed(true)}
      testID="dapp-icon-image"
    />
  )

  return (
    <View width={size}>
      <View position="absolute" top={-10} right={-10} zIndex={1}>
        {badgeContent && (
          <Badge themeName={badgeThemeName} content={badgeContent} circleSize="$6" circleProps={{ bordered: true }} />
        )}
      </View>
      <YStack width={size} height={size} borderRadius={circle ? size : '$3'} overflow="hidden">
        {image}
      </YStack>
    </View>
  )
}
