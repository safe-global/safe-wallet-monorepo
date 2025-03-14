import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTokenValue } from 'tamagui'
import { useWindowDimensions } from 'react-native'

/**
 * This is a necessary workaround around this bug:
 * https://github.com/expo/expo/issues/34352
 * https://github.com/software-mansion/react-native-screens/issues/2587
 *
 * For some reason the height of the View is wrong, when the view is inside a Modal.
 */
export const useModalStyle = () => {
  const { height } = useWindowDimensions()
  const { bottom } = useSafeAreaInsets()

  const bottomValue = bottom > 0 ? bottom : 16

  const modalStyle =
    Platform.OS === 'ios'
      ? {
          height: height - bottomValue * 2,
        }
      : {
          flex: 1,
        }

  return {
    ...modalStyle,
    paddingBottom: bottom * 2 + getTokenValue('$4'),
  }
}
