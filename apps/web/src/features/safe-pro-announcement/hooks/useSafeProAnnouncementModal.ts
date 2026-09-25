import { useEffect, useState } from 'react'
import { localItem } from '@/services/local-storage/local'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useIsSafeProAnnouncementEnabled } from './useIsSafeProAnnouncementEnabled'

export const SAFE_PRO_ANNOUNCEMENT_SEEN_KEY = 'safeProAnnouncementSeen'

const seenStore = localItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)

// Read synchronously, not via useLocalStorage: its store hydrates in an effect, flashing the modal
// at returning visitors for one render.
export function useSafeProAnnouncementModal(isWorkspaceReady: boolean) {
  const [isOpen, setIsOpen] = useState(false)
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isLive = useIsSafeProEnabled() === true
  const isReady = isAnnounced && !isLive && isWorkspaceReady

  useEffect(() => {
    if (!isReady || seenStore.get()) return

    // Marked on open, not on dismiss: leaving the page counts as having seen it.
    seenStore.set(true)
    setIsOpen(true)
  }, [isReady])

  return { isOpen, setIsOpen }
}
