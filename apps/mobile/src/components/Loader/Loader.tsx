import React from 'react'
import { View } from 'tamagui'

import { CircleSnail, CircleSnailPropTypes } from 'react-native-progress'

type LoaderProps = CircleSnailPropTypes & {
  size?: number
  color?: string
}

export function Loader({ size = 64, color = '#12FF80', ...rest }: LoaderProps) {
  return (
    <View justifyContent="center" alignItems="center">
      <CircleSnail size={size} color={color} {...rest} />
    </View>
  )
}
