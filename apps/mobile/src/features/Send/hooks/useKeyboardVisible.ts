import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setVisible(true))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  return visible
}
