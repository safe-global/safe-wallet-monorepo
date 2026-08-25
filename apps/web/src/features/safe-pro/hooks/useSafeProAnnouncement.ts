import { useEffect, useState } from 'react'
import { localItem } from '@/services/local-storage/local'

export const SAFE_PRO_ANNOUNCEMENT_SEEN_KEY = 'safeProAnnouncementSeen'

const seenStore = localItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)

/**
 * One-shot Pro announcement. Read synchronously rather than via useLocalStorage, whose external
 * store hydrates in an effect — a returning visitor would see the modal for one render first.
 *
 * `isReady` is the caller's gate (flag resolved, right screen), so nothing is marked seen while
 * the chain config is still in flight and the announcement still fires once the flag flips.
 */
export function useSafeProAnnouncement(isReady: boolean) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isReady || seenStore.get()) return

    // Marked on open, not on dismiss: leaving the page counts as having seen it.
    seenStore.set(true)
    setIsOpen(true)
  }, [isReady])

  return { isOpen, setIsOpen }
}
