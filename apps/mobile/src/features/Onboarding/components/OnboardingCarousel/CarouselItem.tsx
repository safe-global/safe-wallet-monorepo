import { getTokenValue, Text, View, YStack } from 'tamagui'
import React from 'react'

export type CarouselItem = {
  title: string | React.ReactNode
  name: string
  description?: string
  image?: React.ReactNode
  imagePosition?: 'top' | 'bottom'
}

interface CarouselItemProps {
  item: CarouselItem
  testID?: string
}

export const CarouselItem = ({
  item: { title, description, image, imagePosition = 'top' },
  testID,
}: CarouselItemProps) => {
  return (
    <View gap="$8" alignItems="center" justifyContent="center" testID={testID}>
      {imagePosition === 'top' && image}
      <YStack gap="$8" paddingHorizontal="$5">
        <YStack>{title}</YStack>

        <Text textAlign="center" fontSize={'$4'} color={getTokenValue('$color.textContrastDark')}>
          {description}
        </Text>
      </YStack>
      {imagePosition === 'bottom' && image}
    </View>
  )
}
