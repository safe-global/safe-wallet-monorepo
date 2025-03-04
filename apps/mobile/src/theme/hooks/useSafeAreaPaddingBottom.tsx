import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getVariable } from 'tamagui'

export const useSafeAreaPaddingBottom = (): number => {
  const insets = useSafeAreaInsets()
  return insets.bottom + insets.top + Number(getVariable('$4'))
}
