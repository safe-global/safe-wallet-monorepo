import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { listeners } from './keyboardListeners'
import { actionHandlers } from './keyboardActionHandlers'

const useKeyboardObserver = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const listener of listeners) {
        const action = listener(event)
        if (action !== undefined) {
          event.preventDefault()
          actionHandlers[action](dispatch)
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])
}

export default useKeyboardObserver
