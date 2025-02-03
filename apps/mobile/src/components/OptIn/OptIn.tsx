import React from 'react'
import { ImageSourcePropType, StyleSheet } from 'react-native'
import { View, Image, Text } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { WINDOW_HEIGHT } from '@/src/store/constants'
import { FloatingContainer } from '../FloatingContainer'

interface OptInProps {
  title: string
  ctaButton: {
    onPress: () => void
    label: string
  }
  kicker?: string
  description?: string
  image?: ImageSourcePropType
  secondaryButton?: {
    onPress: () => void
    label: string
  }
  testID?: string
  isVisible?: boolean
}

export const OptIn: React.FC<OptInProps> = React.memo(
  ({ testID, kicker, title, description, image, ctaButton, secondaryButton, isVisible }: OptInProps) => {
    if (!isVisible) {
      return
    }

    return (
      <View
        testID={testID}
        style={styles.wrapper}
        padding="$4"
        gap="$8"
        alignItems="center"
        justifyContent="flex-start"
      >
        {kicker && (
          <Text textAlign="center" fontWeight={700} fontSize="$4" lineHeight="$6">
            {kicker}
          </Text>
        )}
        <Text textAlign="center" fontWeight={600} fontSize="$8" lineHeight="$8">
          {title}
        </Text>
        {description && (
          <Text textAlign="center" fontWeight={400} fontSize="$4">
            {description}
          </Text>
        )}
        {image && <Image style={styles.image} source={image} />}

        <FloatingContainer sticky testID="notifications-opt-in-cta-buttons">
          <SafeButton onPress={ctaButton.onPress} label={ctaButton.label} />
          {secondaryButton && (
            <SafeButton variant="secondary" onPress={secondaryButton.onPress} label={secondaryButton.label} />
          )}
        </FloatingContainer>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: Math.abs(WINDOW_HEIGHT * 0.42),
  },
})

OptIn.displayName = 'OptIn'
