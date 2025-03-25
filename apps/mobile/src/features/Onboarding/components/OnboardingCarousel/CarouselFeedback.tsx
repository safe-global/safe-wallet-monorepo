import React, { useEffect } from 'react'
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated'
import { getTokenValue } from 'tamagui'

interface CarouselFeedbackProps {
  isActive: boolean
}

const UNACTIVE_WIDTH = 4
const ACTIVE_WIDTH = 24

export function CarouselFeedback({ isActive }: CarouselFeedbackProps) {
  const width = useSharedValue(UNACTIVE_WIDTH)

  useEffect(() => {
    if (isActive) {
      width.value = withSpring(ACTIVE_WIDTH)
    } else {
      width.value = withSpring(UNACTIVE_WIDTH)
    }
  }, [isActive])

  return (
    <Animated.View
      testID="carousel-feedback"
      style={{
        borderRadius: 50,
        backgroundColor: isActive ? getTokenValue('$color.textContrastDark') : getTokenValue('$color.primaryLightDark'),
        height: UNACTIVE_WIDTH,
        width,
      }}
    />
  )
}
