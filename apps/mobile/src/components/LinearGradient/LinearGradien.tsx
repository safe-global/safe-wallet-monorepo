import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { useTheme } from 'tamagui'
import { StyleSheet, ViewStyle } from 'react-native'

export const AbsoluteLinearGradient = ({ colors, style }: { colors?: [string, string]; style?: ViewStyle }) => {
  const theme = useTheme()
  const colorsToUse: [string, string] = colors || [theme.success.get(), 'transparent']

  return <ExpoLinearGradient colors={colorsToUse} style={[styles.background, style]} />
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
    opacity: 0.1,
  },
})
