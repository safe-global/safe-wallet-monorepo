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

// expo-image can't render SVG, so route SVG URLs through SvgUri. Detection is by extension;
// extension-less SVGs just fail to load and fall back to the placeholder like any broken URL.
const isSvgUrl = (url?: string): boolean => !!url && /\.svg($|\?|#)/i.test(url)

export const DappIcon: React.FC<Props> = ({ url, size = 64, circle = false, badgeContent, badgeThemeName }) => {
  // Track WHICH url failed, not a boolean: the host re-renders this in place per FIFO head, so
  // one dApp's failure must not blank the next dApp's valid icon.
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
