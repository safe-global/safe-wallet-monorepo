import React from 'react'
import { getVariable, useTheme, View } from 'tamagui'
import { CircleSnail, type CircleSnailPropTypes } from 'react-native-progress'

type LoaderProps = CircleSnailPropTypes & {
  size?: number
  color?: string
}

export function Loader({ size = 64, color = '#12FF80', ...rest }: LoaderProps) {
  const theme = useTheme()
  const resolved = color?.startsWith('$') ? theme[color]?.get() || getVariable(color, 'color') : color

  return (
    <View justifyContent="center" alignItems="center">
      <CircleSnail size={size} color={resolved} {...rest} />
    </View>
  )
}
