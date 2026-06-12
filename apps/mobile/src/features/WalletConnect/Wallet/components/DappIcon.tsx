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
  // Track WHICH url failed rather than a boolean latch: the request-sheet host re-renders
  // this component in place when the FIFO head changes, so a failure for one dApp's icon
  // must not blank the next dApp's perfectly valid one.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showPlaceholder = !url || failedUrl === url

  const image = showPlaceholder ? (
    <YStack
      width={size}
      height={size}
      borderRadius={circle ? size : '$3'}
      backgroundColor="$backgroundSecondary"
      testID="dapp-icon-placeholder"
    />
  ) : isSvgUrl(url) ? (
    <SvgUri uri={url} width={size} height={size} onError={() => setFailedUrl(url)} />
  ) : (
    <Image
      source={url}
      style={{ width: size, height: size }}
      contentFit="contain"
      onError={() => setFailedUrl(url)}
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
