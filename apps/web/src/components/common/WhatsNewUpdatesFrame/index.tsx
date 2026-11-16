import type { ReactElement } from 'react'
import { BEAMER_ID } from '@/config/constants'
import { useWhatsNewUpdateListener } from '@/hooks/useWhatsNewUpdateListener'
import { useAppSelector } from '@/store'
import { BEAMER_ORIGIN } from '@/store/api/beamer'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'

const WhatsNewUpdatesFrame = (): ReactElement | null => {
  const hasConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))
  useWhatsNewUpdateListener()

  if (!hasConsent || !BEAMER_ID) return null

  return (
    <iframe
      src={`${BEAMER_ORIGIN}/utilities?app_id=${BEAMER_ID}`}
      title="What's new updates"
      hidden
      sandbox="allow-scripts allow-same-origin"
      onLoad={(event) => event.currentTarget.contentWindow?.postMessage('initUpdatesListener', BEAMER_ORIGIN)}
    />
  )
}

export default WhatsNewUpdatesFrame
