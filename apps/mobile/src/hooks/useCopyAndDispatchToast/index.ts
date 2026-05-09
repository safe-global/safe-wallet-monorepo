import { useToastController } from '@tamagui/toast'
import Clipboard from '@react-native-clipboard/clipboard'
import { usePathname } from 'expo-router'
import { trackEvent } from '@/src/services/analytics/firebaseAnalytics'
import { createAddressCopyEvent } from '@/src/services/analytics/events/copy'

export const useCopyAndDispatchToast = (text = 'Address copied.') => {
  const toast = useToastController()
  const pathname = usePathname()

  return (value: string) => {
    Clipboard.setString(value)
    toast.show(text, {
      native: false,
      duration: 2000,
    })

    try {
      const event = createAddressCopyEvent(pathname)
      trackEvent(event)
    } catch (error) {
      console.error('Error tracking address copy event:', error)
    }
  }
}
