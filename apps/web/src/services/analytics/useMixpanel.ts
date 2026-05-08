import { useEffect, useMemo, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  mixpanelInit,
  mixpanelSetBlockchainNetwork,
  mixpanelSetDeviceType,
  mixpanelSetSafeAddress,
  mixpanelSetUserProperties,
  mixpanelIdentify,
  mixpanelSetEOAWalletLabel,
  mixpanelSetEOAWalletAddress,
  mixpanelSetEOAWalletNetwork,
  mixpanelSetWorkspaceId,
  mixpanelSetAuthMethod,
  mixpanelOptInTracking,
  mixpanelOptOutTracking,
} from './mixpanel'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { IS_PRODUCTION } from '@/config/constants'
import { useMediaQuery } from '@mui/material'
import { DeviceType } from './types'
import { MixpanelUserProperty } from './mixpanel-events'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useMixpanelUserProperties } from './useMixpanelUserProperties'
import { useChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentSpaceId } from '@/features/spaces'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'

const useMixpanel = () => {
  const isMixpanelEnabled = useHasFeature(FEATURES.MIXPANEL)
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const deviceType = useMemo(() => {
    return isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  }, [isMobile, isTablet])
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const isSpaceRoute = useIsSpaceRoute()
  const userProperties = useMixpanelUserProperties()
  const { safe } = useSafeInfo()
  const currentChain = useChain(safe?.chainId || '')
  const walletChain = useChain(wallet?.chainId || '')
  const lastUserPropertiesRef = useRef<string | null>(null)
  const spaceId = useCurrentSpaceId()
  const { data: session } = useAuthGetMeV1Query(undefined, { skip: !isSpaceRoute })

  useEffect(() => {
    if (isMixpanelEnabled) {
      mixpanelInit()
    }
  }, [isMixpanelEnabled])

  useEffect(() => {
    if (!isMixpanelEnabled) return

    if (isAnalyticsEnabled) {
      mixpanelOptInTracking()
      if (!IS_PRODUCTION) {
        console.info('[Mixpanel] - User opted in')
      }
    } else {
      mixpanelOptOutTracking()
      if (!IS_PRODUCTION) {
        console.info('[Mixpanel] - User opted out')
      }
    }
  }, [isMixpanelEnabled, isAnalyticsEnabled])

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
    } else if (isSpaceRoute && wallet?.address) {
      mixpanelIdentify(wallet.address)
    }
  }, [safeAddress, isSpaceRoute, wallet?.address])

  useEffect(() => {
    if (wallet) {
      const walletProperties: Record<string, any> = {}

      if (wallet.label) {
        walletProperties[MixpanelUserProperty.WALLET_LABEL] = wallet.label
      }
      if (wallet.address) {
        walletProperties[MixpanelUserProperty.WALLET_ADDRESS] = wallet.address
      }

      if (Object.keys(walletProperties).length > 0) {
        mixpanelSetUserProperties(walletProperties)
      }

      if (wallet.label) {
        mixpanelSetEOAWalletLabel(wallet.label)
      }
      if (wallet.address) {
        mixpanelSetEOAWalletAddress(wallet.address)
      }
      if (walletChain) {
        mixpanelSetEOAWalletNetwork(walletChain.chainName)
      }
    } else {
      mixpanelSetEOAWalletLabel('')
      mixpanelSetEOAWalletAddress('')
      mixpanelSetEOAWalletNetwork('')
    }
  }, [wallet, walletChain])

  useEffect(() => {
    if (!userProperties) return

    // Deep comparison to prevent infinite loop from object reference changes
    const currentPropertiesStr = JSON.stringify(userProperties.properties)

    if (lastUserPropertiesRef.current !== currentPropertiesStr) {
      lastUserPropertiesRef.current = currentPropertiesStr
      mixpanelSetUserProperties(userProperties.properties)
    }
  }, [userProperties])

  useEffect(() => {
    mixpanelSetWorkspaceId(isSpaceRoute && spaceId ? spaceId : '')
  }, [isSpaceRoute, spaceId])

  useEffect(() => {
    mixpanelSetAuthMethod(isSpaceRoute && session?.authMethod ? session.authMethod : '')
  }, [isSpaceRoute, session?.authMethod])
}

export default useMixpanel
