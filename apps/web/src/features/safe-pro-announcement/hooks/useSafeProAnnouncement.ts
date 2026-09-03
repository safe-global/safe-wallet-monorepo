import { useEffect, useState } from 'react'
import { localItem } from '@/services/local-storage/local'

export const SAFE_PRO_ANNOUNCEMENT_SEEN_KEY = 'safeProAnnouncementSeen'
export const SAFE_PRO_TRIAL_PROMPT_SEEN_KEY = 'safeProTrialPromptSeen'

// Read synchronously, not via useLocalStorage: its store hydrates in an effect, flashing the modal
// at returning visitors for one render.
function useOpenOnce(key: string, isReady: boolean) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const seenStore = localItem<boolean>(key)
    if (!isReady || seenStore.get()) return

    // Marked on open, not on dismiss: leaving the page counts as having seen it.
    seenStore.set(true)
    setIsOpen(true)
  }, [key, isReady])

  return { isOpen, setIsOpen }
}

export const useSafeProAnnouncement = (isReady: boolean) => useOpenOnce(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY, isReady)

export const useSafeProTrialPrompt = (isReady: boolean) => useOpenOnce(SAFE_PRO_TRIAL_PROMPT_SEEN_KEY, isReady)
