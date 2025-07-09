import { useEffect } from 'react'
import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION } from '@/config/constants'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * Initializes Mixpanel analytics for the web app for analytics.
 * Should be called once at app startup.
 */
const useMixpanel = () => {
  const isMixpanelEnabled = useHasFeature(FEATURES.MIXPANEL)

  useEffect(() => {
    // Only initialize in the browser
    if (typeof window === 'undefined') return

    // Check if Mixpanel feature is enabled
    if (!isMixpanelEnabled) return

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    if (!token) return

    mixpanel.init(token, {
      debug: !IS_PRODUCTION,
      autocapture: true,
      // Enable people tracking for user attributes
      track_pageview: true,
      persistence: 'localStorage',
    })

    // Track initial page view
    mixpanel.track('Page Viewed Safe Test', {
      page: window.location.pathname,
      url: window.location.href,
    })
  }, [isMixpanelEnabled])
}

export default useMixpanel
