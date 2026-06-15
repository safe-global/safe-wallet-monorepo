import React from 'react'
import { Pressable } from 'react-native'
import { Text, XStack } from 'tamagui'

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

// iOS-style segmented control: a recessed track with a raised "thumb" on the selected segment.
// Sizes to its content and centres itself. Colours follow the active theme — wrap it in a dark
// Theme to get the Figma sheet control (dark track, white thumb, dark selected text).
export function SegmentedControl<T extends string>({ options, value, onChange, testID }: SegmentedControlProps<T>) {
  return (
    <XStack
      alignSelf="center"
      backgroundColor="$backgroundSecondary"
      borderRadius={10}
      padding={3}
      gap={2}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <XStack
              justifyContent="center"
              alignItems="center"
              paddingVertical="$2"
              paddingHorizontal="$4"
              borderRadius={8}
              backgroundColor={selected ? '$color' : 'transparent'}
              shadowColor="#000"
              shadowOpacity={selected ? 0.15 : 0}
              shadowRadius={2}
              shadowOffset={{ width: 0, height: 1 }}
            >
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
