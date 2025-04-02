import React from 'react'
import { View } from 'tamagui'

import { CircleSnail, CircleSnailPropTypes } from 'react-native-progress'
interface LoaderProps {
  size?: number
  color?: string
  props?: CircleSnailPropTypes
}

export function Loader({ size = 64, color = '#12FF80', ...props }: LoaderProps) {
  return (
    <View justifyContent="center" alignItems="center">
      <CircleSnail size={size} color={color} {...props} />
    </View>
  )
}
