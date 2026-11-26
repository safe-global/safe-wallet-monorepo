import { useState } from 'react'
import { localItem } from '@/services/local-storage/local'
import { useOverlay } from '@/services/overlay-queue/useOverlay'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useIsSafeProAnnouncementEnabled } from './useIsSafeProAnnouncementEnabled'

export const SAFE_PRO_ANNOUNCEMENT_SEEN_KEY = 'safeProAnnouncementSeen'

const seenStore = localItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)

export function useSafeProAnnouncementModal(isWorkspaceReady: boolean) {
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isLive = useIsSafeProEnabled()
  // Read once and synchronously: the flag is written when the announcement shows, which must not close it again
  const [wasSeen] = useState(() => seenStore.get() === true)
  const [isClosed, setIsClosed] = useState(false)

  const isOpen = useOverlay({
    kind: 'announcement',
    isDue: isAnnounced && !isLive && isWorkspaceReady && !wasSeen && !isClosed,
    // Marked when shown, not on dismiss: leaving the page counts as having seen it.
    onShown: () => seenStore.set(true),
  })

  return { isOpen, close: () => setIsClosed(true) }
}
