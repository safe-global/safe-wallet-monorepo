import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, type LayoutChangeEvent } from 'react-native'
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

type SegmentLayout = { x: number; width: number }

const THUMB_SPRING = { damping: 20, mass: 1.2, stiffness: 250 }

// iOS-style segmented control: a recessed track with a raised "thumb" that springs to the selected
// segment. Sizes to its content and centres itself. Colours follow the active theme — wrap it in a
// dark Theme to get the Figma sheet control (dark track, white thumb, dark selected text).
export function SegmentedControl<T extends string>({ options, value, onChange, testID }: SegmentedControlProps<T>) {
  // Measure each segment so the thumb can animate to its exact position/width (labels differ in size).
  const [layouts, setLayouts] = useState<Record<string, SegmentLayout>>({})
  const selectedLayout = layouts[value]

  const left = useSharedValue(0)
  const width = useSharedValue(0)
  const initialised = useRef(false)

  const moveThumb = useCallback(
    (segment: T, animated: boolean) => {
      const layout = layouts[segment]
      if (!layout) {
        return
      }
      if (animated) {
        left.value = withSpring(layout.x, THUMB_SPRING)
        width.value = withSpring(layout.width, THUMB_SPRING)
      } else {
        left.value = layout.x
        width.value = layout.width
      }
    },
    [layouts, left, width],
  )

  // Snap into place once measured; keep the thumb synced if `value` changes from outside.
  useEffect(() => {
    moveThumb(value, initialised.current)
    if (layouts[value]) {
      initialised.current = true
    }
  }, [value, layouts, moveThumb])

  const handlePress = (segment: T) => {
    // Start the spring synchronously on press — before onChange triggers a potentially heavy parent
    // re-render (revealing the other tab) that would otherwise delay the effect-driven animation.
    moveThumb(segment, initialised.current)
    onChange(segment)
  }

  const thumbStyle = useAnimatedStyle(() => ({ left: left.value, width: width.value }))

  const handleSegmentLayout = (segment: string) => (event: LayoutChangeEvent) => {
    const { x, width: w } = event.nativeEvent.layout
    setLayouts((prev) => {
      const existing = prev[segment]
      if (existing && existing.x === x && existing.width === w) {
        return prev
      }
      return { ...prev, [segment]: { x, width: w } }
    })
  }

  return (
    <XStack alignSelf="center" backgroundColor="$backgroundSecondary" borderRadius={10} padding={3} testID={testID}>
      {selectedLayout ? (
        <Animated.View style={[{ position: 'absolute', top: 3, bottom: 3 }, thumbStyle]}>
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
      ) : null}

      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            onLayout={handleSegmentLayout(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
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
