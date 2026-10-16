import { GA_TRACKING_ID, IS_PRODUCTION, SAFE_APPS_GA_TRACKING_ID } from '@/config/constants'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect } from 'react'

const Analytics = () => {
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))

  useEffect(() => {
    if (!isAnalyticsEnabled) return
    // This needs to be added once in order for events with send_to: SAFE_APPS_GA_TRACKING_ID to work
    window.gtag?.('config', SAFE_APPS_GA_TRACKING_ID, { debug_mode: !IS_PRODUCTION })
  }, [isAnalyticsEnabled])

  if (!isAnalyticsEnabled) return null

  return <GoogleAnalytics gaId={GA_TRACKING_ID} debugMode={!IS_PRODUCTION} />
}

export default Analytics
