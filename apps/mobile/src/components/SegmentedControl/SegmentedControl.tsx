import React, { useEffect } from 'react'
import { Pressable } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Text, View, XStack } from 'tamagui'

export type SegmentedControlOption<T extends string> = {
  label: string
  value: T
}

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  testID?: string
}

// Slightly under-damped so the thumb overshoots and snaps into place at the end.
const THUMB_SPRING = { damping: 20, mass: 1.2, stiffness: 250 }

// iOS-style segmented control: a recessed track with a raised thumb that slides to the selected
// segment. Segments are equal width and the thumb is positioned in percentages, so it needs no
// layout measurement — it renders in the right place on the first frame (even on Android) and still
// animates. Colours follow the active theme — wrap it in a dark Theme to get the Figma sheet control
// (dark track, white thumb, dark selected text).
export function SegmentedControl<T extends string>({ options, value, onChange, testID }: SegmentedControlProps<T>) {
  const count = options.length
  const segmentPercent = 100 / count
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const progress = useSharedValue(selectedIndex)
  useEffect(() => {
    progress.value = withSpring(selectedIndex, THUMB_SPRING)
  }, [selectedIndex, progress])

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * segmentPercent}%`,
    width: `${segmentPercent}%`,
  }))

  return (
    <XStack width="50%" alignSelf="center" backgroundColor="$backgroundSecondary" borderRadius={10} testID={testID}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, padding: 3 }, thumbStyle]}>
        <View
          flex={1}
          borderRadius={8}
          backgroundColor="$color"
          shadowColor="#000"
          shadowOpacity={0.15}
          shadowRadius={2}
          shadowOffset={{ width: 0, height: 1 }}
        />
      </Animated.View>

      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={{ flex: 1 }}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <XStack justifyContent="center" alignItems="center" paddingVertical="$2" paddingHorizontal="$4">
              <Text
                fontSize={14}
                fontWeight={selected ? '600' : '400'}
                color={selected ? '$background' : '$colorSecondary'}
              >
                {option.label}
              </Text>
            </XStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
