import { useCallback } from 'react'
import { BEAMER_ID } from '@/config/constants'
import { useAppSelector } from '@/store'
import { useGetBeamerUpdatesQuery } from '@/store/api/beamer'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import local from '@/services/local-storage/local'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const LAST_SEEN_KEY = 'beamerLastSeen'
// Beamer marks its response as cacheable for 20 minutes, so asking more often returns the same answer.
const POLLING_INTERVAL = 20 * 60 * 1000

export const useBeamerUpdates = () => {
  const hasConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))
  const [storedLastSeen, setLastSeen] = useLocalStorage<string>(LAST_SEEN_KEY)
  // useLocalStorage reads storage only after mount; without this the first request would go out without the date.
  const lastSeen = storedLastSeen ?? local.getItem<string>(LAST_SEEN_KEY) ?? undefined

  const { data } = useGetBeamerUpdatesQuery(
    { productId: BEAMER_ID, lastSeen },
    { skip: !hasConsent || !BEAMER_ID, pollingInterval: POLLING_INTERVAL },
  )

  const markAsSeen = useCallback(() => setLastSeen(new Date().toISOString()), [setLastSeen])

  return { unreadCount: data?.unreadCount ?? 0, topBar: data?.topBar, markAsSeen }
}
