import React from 'react'
import { Image } from 'expo-image'
import { SvgUri } from 'react-native-svg'
import { YStack } from 'tamagui'

type Props = {
  url?: string
  size?: number
}

// dApp metadata icons come in both raster (png/jpg/webp) and SVG. Tamagui's Image (RN Image)
// and expo-image can't render SVG, so route SVG URLs through react-native-svg's SvgUri.
// Detection is by extension — SVGs served without one fall through to expo-image and simply
// render blank, the same as today; the placeholder covers the missing-icon case.
const isSvgUrl = (url?: string): boolean => !!url && /\.svg($|\?|#)/i.test(url)

export const DappIcon: React.FC<Props> = ({ url, size = 64 }) => {
  if (!url) {
    return <YStack width={size} height={size} borderRadius="$3" backgroundColor="$backgroundSecondary" />
  }

  const image = isSvgUrl(url) ? (
    <SvgUri uri={url} width={size} height={size} />
  ) : (
    <Image source={url} style={{ width: size, height: size }} contentFit="contain" />
  )

  return (
    <YStack width={size} height={size} borderRadius="$3" overflow="hidden">
      {image}
    </YStack>
  )
}
