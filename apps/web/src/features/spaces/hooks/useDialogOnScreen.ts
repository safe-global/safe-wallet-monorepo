import { useEffect } from 'react'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

const dialogsOnScreen = new ExternalStore<number>(0)

/** Counts the calling dialog as on screen while `isOnScreen` holds, so overlays such as the tour can wait for it. */
export const useDialogOnScreen = (isOnScreen: boolean) => {
  useEffect(() => {
    if (!isOnScreen) return
    dialogsOnScreen.setStore((count = 0) => count + 1)
    return () => dialogsOnScreen.setStore((count = 0) => count - 1)
  }, [isOnScreen])
}

export const useIsDialogOnScreen = (): boolean => (dialogsOnScreen.useStore() ?? 0) > 0
