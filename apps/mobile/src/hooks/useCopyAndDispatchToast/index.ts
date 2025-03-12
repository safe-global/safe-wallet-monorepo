import { useToastController } from '@tamagui/toast'
import Clipboard from '@react-native-clipboard/clipboard'

export const useCopyAndDispatchToast = (text = 'Address copied.') => {
  const toast = useToastController()

  return (value: string) => {
    Clipboard.setString(value)
    toast.show(text, {
      native: false,
      duration: 2000,
    })
  }
}
