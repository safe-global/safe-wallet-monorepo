import React from 'react'
import { Switch, StyleSheet } from 'react-native'
import { getTokenValue, useTheme, View } from 'tamagui'
import { Loader } from '../Loader'

interface LoadableSwitchProps {
  isLoading?: boolean
  value: boolean
  onChange: () => void
  testID?: string
  trackColor?: {
    true: string
    false?: string
  }
}

export const LoadableSwitch: React.FC<LoadableSwitchProps> = ({
  isLoading = false,
  value,
  onChange,
  testID,
  trackColor = { true: '$primary' },
}) => {
  const theme = useTheme()

  const resolveThemeColor = (color: string) => {
    if (color.startsWith('$')) {
      const themeKey = color.slice(1) // remove the '$' prefix
      const themeValue = theme[themeKey as keyof typeof theme]
      return themeValue?.get() || getTokenValue(color as unknown as 'auto') || color
    }
    return color
  }

  return (
    <View position="relative">
      {isLoading && (
        <View style={styles.loaderContainer} backgroundColor="$background">
          <Loader size={24} color={value ? resolveThemeColor(trackColor.true) : '#ccc'} />
        </View>
      )}
      <Switch testID={testID} onValueChange={onChange} value={value} trackColor={trackColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    width: 51,
    height: 31,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
