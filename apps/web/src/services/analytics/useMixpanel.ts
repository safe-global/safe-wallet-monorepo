/**
 * Track analytics events using MixPanel
 * This hook mirrors the useGtm hook for consistency
 */
import { useEffect, useState, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  mixpanelInit,
  mixpanelSetBlockchainNetwork,
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
import { useMediaQuery } from '@mui/material'
import { DeviceType } from './types'
import { MixPanelUserProperty } from './mixpanel-events'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useMixPanelUserProperties } from './useMixPanelUserProperties'
import { useChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'

const useMixpanel = () => {
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
  const { safe } = useSafeInfo()
  const currentChain = useChain(safe?.chainId || '')

  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelInit()
    }
  }, [isMixpanelEnabled])

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

  useEffect(() => {
    if (currentChain) {
      mixpanelSetBlockchainNetwork(currentChain.chainName)
    }
  }, [currentChain])

  useEffect(() => {
    mixpanelSetDeviceType(deviceType)
  }, [deviceType])

  useEffect(() => {
    mixpanelSetSafeAddress(safeAddress)

    if (safeAddress && !isSpaceRoute) {
      mixpanelIdentify(safeAddress)
    }
  }, [safeAddress, isSpaceRoute])

  useEffect(() => {
    if (wallet?.label) {
      mixpanelSetUserProperties(MixPanelUserProperty.WALLET_LABEL, wallet.label)
    }
    if (wallet?.address) {
      mixpanelSetUserProperties(MixPanelUserProperty.WALLET_ADDRESS, wallet.address)
    }
  }, [wallet?.label, wallet?.address])

  useEffect(() => {
    if (!userProperties) return

    mixpanelSetUserProperties(userProperties.properties)
  }, [userProperties])

  useEffect(() => {
    if (!currentChain) return

    const currentNetworkName = currentChain.chainName.toLowerCase()

    mixpanelUnionUserProperty(MixPanelUserProperty.NETWORKS, [currentNetworkName])
  }, [currentChain])
}

export default useMixpanel
