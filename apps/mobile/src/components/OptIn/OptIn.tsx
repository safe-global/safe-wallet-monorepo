import React from 'react'
import { ColorSchemeName, ImageSourcePropType, StyleSheet } from 'react-native'
import { H2, Image, Text, getTokenValue, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { WINDOW_HEIGHT } from '@/src/store/constants'
import { Loader } from '../Loader'
import { SafeFontIcon } from '../SafeFontIcon'
import { Container } from '../Container'

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
  isLoading?: boolean
  colorScheme: ColorSchemeName
  infoMessage?: string
}

export const OptIn: React.FC<OptInProps> = React.memo(
  ({
    testID,
    kicker,
    title,
    description,
    image,
    ctaButton,
    secondaryButton,
    isVisible,
    isLoading,
    colorScheme,
    infoMessage,
  }: OptInProps) => {
    if (!isVisible) {
      return
    }

    return (
      <View testID={testID} style={[styles.wrapper]} paddingTop={'$10'}>
        <View flex={1} justifyContent="space-between" alignItems="center">
          <View gap={'$4'} paddingHorizontal={'$4'}>
            {kicker && (
              <Text textAlign="center" fontWeight={700} fontSize="$4" lineHeight="$6">
                {kicker}
              </Text>
            )}
            <H2 textAlign="center" fontWeight={600}>
              {title}
            </H2>
            {description && (
              <Text textAlign="center" fontWeight={400} fontSize="$4" paddingHorizontal={'$4'}>
                {description}
              </Text>
            )}
            {infoMessage && (
              <Container
                flexDirection="row"
                gap={'$2'}
                paddingVertical={'$2'}
                justifyContent="center"
                alignItems="center"
              >
                <SafeFontIcon testID="info-icon" name="info" size={20} />
                <Text fontSize="$3" color="$textMuted">
                  {infoMessage}
                </Text>
              </Container>
            )}
          </View>
          {image && <Image style={styles.image} source={image} />}
        </View>

        <View testID="notifications-opt-in-cta-buttons" flexDirection="column" paddingHorizontal={'$4'} gap="$4">
          <SafeButton onPress={ctaButton.onPress} marginBottom={'$3'} testID={'opt-in-primary-button'} size="$xl">
            {!isLoading ? (
              ctaButton.label
            ) : (
              <Loader
                size={24}
                color={
                  colorScheme === 'dark'
                    ? getTokenValue('$color.textContrastDark')
                    : getTokenValue('$color.primaryLightDark')
                }
              />
            )}
          </SafeButton>
          {secondaryButton && (
            <SafeButton text onPress={secondaryButton.onPress} testID={'opt-in-secondary-button'} size="$xl">
              {secondaryButton.label}
            </SafeButton>
          )}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: getTokenValue('$4', 'space'),
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: Math.abs(WINDOW_HEIGHT * 0.42),
    marginBottom: 40,
  },
})

OptIn.displayName = 'OptIn'
