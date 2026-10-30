import { useEffect } from 'react'
import { BEAMER_ID } from '@/config/constants'
import { useAppDispatch, useAppSelector } from '@/store'
import { beamerApi } from '@/store/api/beamer'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'

const BEAMER_ORIGIN = 'https://app.getbeamer.com'
// Our Beamer settings ("updatesDelay"): after a new post, each browser waits a random time up to this long before
// asking for it, so that not every open tab asks Beamer at the same moment.
const MAX_UPDATE_DELAY = 10 * 60 * 1000
const MIN_UPDATE_DELAY = 100

export const useBeamerLiveUpdates = () => {
  const dispatch = useAppDispatch()
  const hasConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))

  useEffect(() => {
    if (!hasConsent || !BEAMER_ID) return

    let refetchTimeout: ReturnType<typeof setTimeout> | undefined
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== BEAMER_ORIGIN || typeof event.data !== 'string') return
      if (!event.data.startsWith('updatesAvailable')) return

      const isImmediate = event.data.includes('"immediate":true')
      const delay = isImmediate ? 0 : Math.max(MIN_UPDATE_DELAY, Math.ceil(Math.random() * MAX_UPDATE_DELAY))
      clearTimeout(refetchTimeout)
      refetchTimeout = setTimeout(() => dispatch(beamerApi.util.invalidateTags(['BeamerUpdates'])), delay)
    }
    window.addEventListener('message', onMessage)

    const frame = document.createElement('iframe')
    frame.src = `${BEAMER_ORIGIN}/utilities?app_id=${BEAMER_ID}`
    frame.title = "What's new updates"
    frame.hidden = true
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    frame.addEventListener('load', () => frame.contentWindow?.postMessage('initUpdatesListener', BEAMER_ORIGIN))
    document.body.appendChild(frame)

    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(refetchTimeout)
      frame.remove()
    }
  }, [dispatch, hasConsent])
}
