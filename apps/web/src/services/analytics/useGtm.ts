/**
 * Track analytics events using Google Tag Manager
 */
import { useEffect, useState } from 'react'
import {
  gtmTrackPageview,
  gtmSetChainId,
  gtmEnableCookies,
  gtmDisableCookies,
  gtmSetDeviceType,
  gtmSetSafeAddress,
  gtmSetUserProperty,
  gtmTrack,
} from '@/services/analytics/gtm'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import useChainId from '@/hooks/useChainId'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import useMetaEvents from './useMetaEvents'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { AnalyticsUserProperties, DeviceType } from './types'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS } from './events'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

const useGtm = () => {
  const chainId = useChainId()
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const [, setPrevAnalytics] = useState(isAnalyticsEnabled)
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width:599.95px)')
  const isTablet = useMediaQuery('(max-width:899.95px)')
  const deviceType = isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const isSpaceRoute = useIsSpaceRoute()

  // Enable GA cookies if consent was given
  useEffect(() => {
    setPrevAnalytics((prev) => {
      if (isAnalyticsEnabled === prev) return prev

      if (isAnalyticsEnabled) {
        gtmEnableCookies()
      } else {
        gtmDisableCookies()
      }

      return isAnalyticsEnabled
    })
  }, [isAnalyticsEnabled])

  // Set the chain ID for all GTM events
  useEffect(() => {
    gtmSetChainId(chainId)
  }, [chainId])

  // Set device type for all GTM events
  useEffect(() => {
    gtmSetDeviceType(deviceType)
  }, [deviceType])

  // Set safe address for all GTM events
  useEffect(() => {
    gtmSetSafeAddress(safeAddress)

    if (safeAddress && !isSpaceRoute) {
      gtmTrack(OVERVIEW_EVENTS.SAFE_VIEWED)
    }
  }, [safeAddress, isSpaceRoute])

  // Track page views – anonymized by default.
  useEffect(() => {
    // Don't track 404 because it's not a real page, it immediately does a client-side redirect
    if (router.pathname === AppRoutes['404'] || isSpaceRoute) return

    gtmTrackPageview(router.pathname, router.asPath)
  }, [router.asPath, router.pathname, isSpaceRoute])

  useEffect(() => {
    if (wallet?.label) {
      gtmSetUserProperty(AnalyticsUserProperties.WALLET_LABEL, wallet.label)
    }
  }, [wallet?.label])

  useEffect(() => {
    if (wallet?.address) {
      gtmSetUserProperty(AnalyticsUserProperties.WALLET_ADDRESS, wallet.address.slice(2)) // Remove 0x prefix because GA converts it to a number otherwise
    }
  }, [wallet?.address])

  // Track meta events on app load
  useMetaEvents()
}

export default useGtm
