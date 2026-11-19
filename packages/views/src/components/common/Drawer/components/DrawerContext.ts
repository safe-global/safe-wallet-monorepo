import { createContext, useContext } from 'react'

export type DrawerContextValue = {
  onClose: () => void
  /** A header calls this on mount so the Drawer drops its fallback close; returns the unregister. */
  registerHeader: () => () => void
  /** True when expanded, and always on phones. */
  fullScreen: boolean
  /** Present only when the Drawer can be expanded, which it can't on phones. */
  toggleFullScreen?: () => void
}

export const DrawerContext = createContext<DrawerContextValue | null>(null)

/** `null` outside a Drawer, such as a header rendered on its own in a story. */
export const useDrawerContext = (): DrawerContextValue | null => useContext(DrawerContext)
