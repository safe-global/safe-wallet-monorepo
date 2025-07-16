/**
 * Track analytics events using MixPanel
 * This hook mirrors the useGtm hook for consistency
 */
import { useEffect, useState, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  mixpanelInit,
  mixpanelSetChainId,
  mixpanelSetDeviceType,
  mixpanelSetSafeAddress,
  mixpanelSetUserProperties,
  mixpanelUnionUserProperty,
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
import { useMixPanelUserProperties } from './useMixPanelUserProperties'
import { useCurrentChain } from '@/hooks/useChains'

const useMixpanel = () => {
  const chainId = useChainId()
  const isMixpanelEnabled = useHasFeature(FEATURES.MIXPANEL)
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const [, setPrevAnalytics] = useState(isAnalyticsEnabled)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const deviceType = useMemo(() => {
    return isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  }, [isMobile, isTablet])
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const isSpaceRoute = useIsSpaceRoute()
  const userProperties = useMixPanelUserProperties()
  const currentChain = useCurrentChain()

  // Initialize MixPanel (only if feature is enabled)
  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelInit()
    }
  }, [isMixpanelEnabled])

  // Enable/disable tracking based on consent
  useEffect(() => {
    setPrevAnalytics((prev) => {
      if (isAnalyticsEnabled === prev) return prev

      if (isAnalyticsEnabled) {
        mixpanelEnableTracking()
      } else {
        mixpanelDisableTracking()
      }

      return isAnalyticsEnabled
    })
  }, [isAnalyticsEnabled])

  // Set the chain ID for all MixPanel events
  useEffect(() => {
    mixpanelSetChainId(chainId)
  }, [chainId])

  // Set device type for all MixPanel events
  useEffect(() => {
    mixpanelSetDeviceType(deviceType)
  }, [deviceType])

  // Set safe address for all MixPanel events and identify user
  useEffect(() => {
    mixpanelSetSafeAddress(safeAddress)

    if (safeAddress && !isSpaceRoute) {
      // Identify user by safe address for better user tracking
      mixpanelIdentify(safeAddress)
    }
  }, [safeAddress, isSpaceRoute])

  // Set wallet properties
  useEffect(() => {
    if (wallet?.label) {
      mixpanelSetUserProperties(MixPanelUserProperty.WALLET_LABEL, wallet.label)
    }
    if (wallet?.address) {
      mixpanelSetUserProperties(MixPanelUserProperty.WALLET_ADDRESS, wallet.address)
    }
  }, [wallet?.label, wallet?.address])

  // Set Safe-related user properties
  useEffect(() => {
    if (!userProperties) return

    // Set regular properties (already formatted with string keys)
    mixpanelSetUserProperties(userProperties.properties)
  }, [userProperties])

  // Set networks using union operation
  useEffect(() => {
    if (!currentChain) return

    const currentNetworkName = currentChain.chainName.toLowerCase()

    // Use union for networks to append without duplicates
    mixpanelUnionUserProperty(MixPanelUserProperty.NETWORKS, [currentNetworkName])
  }, [currentChain])
}

export default useMixpanel
