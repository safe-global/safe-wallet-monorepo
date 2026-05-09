import { usePreventRemove } from '@react-navigation/native'
import { Alert } from 'react-native'
import { useNavigation } from 'expo-router'

export const usePreventLeaveScreen = (preventRemove: boolean) => {
  const navigation = useNavigation()
  usePreventRemove(preventRemove, ({ data }) => {
    Alert.alert('Discard changes?', 'You have unsaved changes. Discard them and leave the screen?', [
      {
        text: "Don't leave",
        style: 'cancel',
        onPress: () => null,
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ])
  })
}
