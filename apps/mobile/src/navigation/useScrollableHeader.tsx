// useScrollableHeader.ts
import { useEffect } from 'react'
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

interface UseScrollableHeaderProps {
  children: React.ReactNode
  scrollYThreshold?: number // Default threshold for opacity change
  alwaysVisible?: boolean
}

/**
 * https://reactnavigation.org/docs/native-stack-navigator/#headerlargetitle
 * HeaderLargeTitle only works when the header title is a string.
 * If one tries to pass a component as a header title, the LargeHeaderTitle will not work.
 *
 * This hook is a workaround to use a custom component as a header title and update the opacity of the header dynamically.
 *
 * @param children
 * @param scrollYThreshold
 */
export const useScrollableHeader = ({ children, alwaysVisible, scrollYThreshold = 37 }: UseScrollableHeaderProps) => {
  const navigation = useNavigation()
  const opacity = useSharedValue(alwaysVisible ? 1 : 0)

  // Update navigation header title dynamically
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Animated.View
          style={[
            { flex: 1, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
            animatedHeaderStyle,
          ]}
        >
          {children}
        </Animated.View>
      ),
    })
  }, [navigation, children])

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 300 }),
  }))

  // Scroll event handler for updating opacity
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    opacity.value = scrollY > scrollYThreshold ? 1 : alwaysVisible ? 1 : 0
  }

  return {
    handleScroll,
  }
}
