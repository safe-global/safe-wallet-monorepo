/**
 * Track analytics events using MixPanel
 * This hook mirrors the useGtm hook for consistency
 */
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  mixpanelInit,
  mixpanelSetChainId,
  mixpanelSetDeviceType,
  mixpanelSetSafeAddress,
  mixpanelSetUserProperty,
  mixpanelEnableTracking,
  mixpanelDisableTracking,
  mixpanelIdentify,
} from './mixpanel'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useChainId from '@/hooks/useChainId'
import { useMediaQuery } from '@mui/material'
import { DeviceType } from './types'
import { MixPanelUserProperty } from './mixpanel-events'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

const useMixpanel = () => {
  const chainId = useChainId()
  const isMixpanelEnabled = useHasFeature(FEATURES.MIXPANEL)
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const [, setPrevAnalytics] = useState(isAnalyticsEnabled)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const deviceType = isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const isSpaceRoute = useIsSpaceRoute()

  // Initialize MixPanel (only if feature is enabled)
  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelInit()
    }
  }, [isMixpanelEnabled])

  // Enable/disable tracking based on consent
  useEffect(() => {
    if (!isMixpanelEnabled) return

    setPrevAnalytics((prev) => {
      if (isAnalyticsEnabled === prev) return prev

      if (isAnalyticsEnabled) {
        mixpanelEnableTracking()
      } else {
        mixpanelDisableTracking()
      }

      return isAnalyticsEnabled
    })
  }, [isAnalyticsEnabled, isMixpanelEnabled])

  // Set the chain ID for all MixPanel events
  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelSetChainId(chainId)
    }
  }, [chainId, isMixpanelEnabled])

  // Set device type for all MixPanel events
  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelSetDeviceType(deviceType)
    }
  }, [deviceType, isMixpanelEnabled])

  // Set safe address for all MixPanel events and identify user
  useEffect(() => {
    if (!isMixpanelEnabled) return

    mixpanelSetSafeAddress(safeAddress)

    if (safeAddress && !isSpaceRoute) {
      // Identify user by safe address for better user tracking
      mixpanelIdentify(safeAddress)
    }
  }, [safeAddress, isSpaceRoute, isMixpanelEnabled])

  // Set user properties
  useEffect(() => {
    if (!isMixpanelEnabled) return

    if (wallet?.label) {
      mixpanelSetUserProperty(MixPanelUserProperty.WALLET_LABEL, wallet.label)
    }
  }, [wallet?.label, isMixpanelEnabled])

  useEffect(() => {
    if (!isMixpanelEnabled) return

    if (wallet?.address) {
      mixpanelSetUserProperty(MixPanelUserProperty.WALLET_ADDRESS, wallet.address)
    }
  }, [wallet?.address, isMixpanelEnabled])
}

export default useMixpanel
