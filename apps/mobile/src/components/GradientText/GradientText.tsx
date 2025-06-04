import React from 'react'
import { Text, TextProps } from 'tamagui'
import { LinearGradient } from 'expo-linear-gradient'
// @ts-ignore - Type declarations not available for this library
import MaskedView from '@react-native-masked-view/masked-view'

interface GradientTextProps extends TextProps {
  colors: [string, string]
  locations?: [number, number]
  gradientStart?: { x: number; y: number }
  gradientEnd?: { x: number; y: number }
}

export const GradientText = ({
  children,
  colors,
  locations = [0, 1],
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
  ...textProps
}: GradientTextProps) => {
  return (
    <MaskedView
      style={{ flexDirection: 'row' }}
      maskElement={
        <Text {...textProps} style={[textProps.style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={colors} locations={locations} start={gradientStart} end={gradientEnd} style={{ flex: 1 }}>
        <Text {...textProps} style={[textProps.style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  )
}
