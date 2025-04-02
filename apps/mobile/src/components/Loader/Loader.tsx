import React from 'react'
import { View } from 'tamagui'

import { CircleSnail } from 'react-native-progress'
interface LoaderProps {
  size?: number
  color?: string
}

export function Loader({ size = 64, color = '#12FF80' }: LoaderProps) {
  return (
    <View justifyContent="center" alignItems="center">
      <CircleSnail size={size} color={color} />
    </View>
  )
}
