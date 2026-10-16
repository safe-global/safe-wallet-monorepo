import { GA_TRACKING_ID, IS_PRODUCTION, SAFE_APPS_GA_TRACKING_ID } from '@/config/constants'
import { version } from '@/markdown/terms/version'
import local from '@/services/local-storage/local'
import { useAppSelector } from '@/store'
import {
  CookieAndTermType,
  cookiesAndTermsSlice,
  hasConsentFor,
  type CookiesAndTermsState,
} from '@/store/cookiesAndTermsSlice'
import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect, useState } from 'react'

const Analytics = () => {
  // The store loads persisted consent one effect after the first render, so mount-time events would fire before GA exists
  const [hasStoredConsent] = useState(() => {
    const storedCookies = local.getItem<CookiesAndTermsState>(cookiesAndTermsSlice.name)
    return storedCookies?.[CookieAndTermType.ANALYTICS] === true && storedCookies.termsVersion === version
  })
  const hasStoreConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const isAnalyticsEnabled = hasStoreConsent || hasStoredConsent

  useEffect(() => {
    if (!isAnalyticsEnabled) return
    // This needs to be added once in order for events with send_to: SAFE_APPS_GA_TRACKING_ID to work
    window.gtag?.('config', SAFE_APPS_GA_TRACKING_ID, { debug_mode: !IS_PRODUCTION })
  }, [isAnalyticsEnabled])

  if (!isAnalyticsEnabled) return null

  return <GoogleAnalytics gaId={GA_TRACKING_ID} debugMode={!IS_PRODUCTION} />
}

export default Analytics
