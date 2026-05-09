import { getTokenValue, Text, View, YStack } from 'tamagui'
import React from 'react'
import { Dimensions } from 'react-native'

export type CarouselItem = {
  title: string | React.ReactNode
  name: string
  description?: string
  image?: React.ReactNode
  imagePosition?: 'top' | 'bottom'
}

const windowHeight = Dimensions.get('window').height
const maxGoodHeight = 812
interface CarouselItemProps {
  item: CarouselItem
  testID?: string
}

export const CarouselItem = ({
  item: { title, description, image, imagePosition = 'top' },
  testID,
}: CarouselItemProps) => {
  const gap = windowHeight <= maxGoodHeight ? '$4' : '$8'
  return (
    <View gap={gap} alignItems="center" testID={testID} flex={1}>
      {imagePosition === 'top' && image}
      <YStack gap={gap} paddingHorizontal="$5" flex={1}>
        <YStack>{title}</YStack>

        <Text textAlign="center" maxWidth={331} fontSize={'$5'} color={getTokenValue('$color.textContrastDark')}>
          {description}
        </Text>
      </YStack>
      {imagePosition === 'bottom' && image}
    </View>
  )
}
