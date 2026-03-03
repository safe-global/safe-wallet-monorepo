import React, { useMemo } from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'

const MAX_FONT_SIZE = 44
const MIN_FONT_SIZE = 24
const SHRINK_START = 8

interface AmountDisplayProps {
  primaryDisplay: string
  secondaryDisplay: string
  onToggle: () => void
  canToggle: boolean
}

export function AmountDisplay({ primaryDisplay, secondaryDisplay, onToggle, canToggle }: AmountDisplayProps) {
  const display = primaryDisplay

  const fontSize = useMemo(() => {
    const len = display.length
    if (len <= SHRINK_START) {
      return MAX_FONT_SIZE
    }
    const excess = len - SHRINK_START
    const scaled = MAX_FONT_SIZE - excess * 2.5
    return Math.max(scaled, MIN_FONT_SIZE)
  }, [display])

  return (
    <Pressable onPress={canToggle ? onToggle : undefined}>
      <View alignItems="center" gap="$2" paddingVertical="$4">
        <Text
          fontSize={fontSize}
          fontWeight={600}
          color="$color"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_FONT_SIZE / MAX_FONT_SIZE}
          testID="primary-amount"
        >
          {display}
        </Text>
        {secondaryDisplay ? (
          <Text fontSize={16} color="$colorSecondary" testID="secondary-amount">
            {secondaryDisplay}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}
