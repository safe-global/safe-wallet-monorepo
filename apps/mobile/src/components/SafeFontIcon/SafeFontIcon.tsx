import React from 'react'
import createIconSetFromIcoMoon from '@expo/vector-icons/createIconSetFromIcoMoon'
import { useFonts } from 'expo-font'
import { IconName } from '@/src/types/iconTypes'
import { getVariable, useTheme } from 'tamagui'

export const SafeIcon = createIconSetFromIcoMoon(
  require('@/assets/fonts/safe-icons/selection.json'),
  'SafeIcons',
  'safe-icons.ttf',
)

export interface IconProps extends Omit<React.ComponentProps<typeof SafeIcon>, 'name' | 'size' | 'color'> {
  name: IconName
  size?: number
  color?: string
  testID?: string
}

export const SafeFontIcon = ({ name, size = 24, color, ...rest }: IconProps) => {
  const theme = useTheme()
  const iconColor = color ? theme[color]?.get() || getVariable(color, 'color') : theme.color?.get()
  const [fontsLoaded] = useFonts({
    SafeIcons: require('@/assets/fonts/safe-icons/safe-icons.ttf'),
  })

  if (!fontsLoaded) {
    return null
  }

  return <SafeIcon name={name} size={size} color={iconColor} {...rest} />
}
