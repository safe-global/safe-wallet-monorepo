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

export function SegmentedControl<T extends string>({ options, value, onChange, testID }: SegmentedControlProps<T>) {
  return (
    <XStack backgroundColor="$backgroundSecondary" borderRadius={12} padding="$1" gap="$1" testID={testID}>
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
            <XStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              paddingVertical="$3"
              borderRadius={8}
              backgroundColor={selected ? '$background' : 'transparent'}
            >
              <Text fontWeight={selected ? '600' : '400'} color={selected ? '$color' : '$colorSecondary'}>
                {option.label}
              </Text>
            </XStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
