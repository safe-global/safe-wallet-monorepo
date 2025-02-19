import { Dimensions, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTokenValue } from 'tamagui'

/**
 * This is a necessary workaround around this bug:
 * https://github.com/expo/expo/issues/34352
 * https://github.com/software-mansion/react-native-screens/issues/2587
 *
 * For some reason the height of the View is wrong, when the view is inside a Modal.
 */
export const useModalStyle = () => {
  const height = Dimensions.get('screen').height
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
    paddingBottom: bottom + getTokenValue('$4'),
  }
}
