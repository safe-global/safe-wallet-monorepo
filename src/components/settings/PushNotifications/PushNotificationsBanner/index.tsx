import { Button, Chip, Grid, SvgIcon, Typography, IconButton } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import type { ReactElement } from 'react'

import { CustomTooltip } from '@/components/common/CustomTooltip'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes, selectTotalAdded } from '@/store/addedSafesSlice'
import PushNotificationIcon from '@/public/images/notifications/push-notification.svg'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useNotificationRegistrations } from '../hooks/useNotificationRegistrations'
import { transformAddedSafes } from '../GlobalPushNotifications'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { trackEvent } from '@/services/analytics'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckWallet from '@/components/common/CheckWallet'
import CloseIcon from '@/public/images/common/close.svg'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'
import { sameAddress } from '@/utils/addresses'
import useOnboard from '@/hooks/wallets/useOnboard'
import { assertWalletChain } from '@/services/tx/tx-sender/sdk'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { PushNotificationPreferences } from '@/services/push-notifications/preferences'
import type { NotifiableSafes } from '../logic'

import css from './styles.module.css'

const DISMISS_PUSH_NOTIFICATIONS_KEY = 'dismissPushNotifications'

export const useDismissPushNotificationsBanner = () => {
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const { safe } = useSafeInfo()

  const [dismissedBannerPerChain = {}, setDismissedBannerPerChain] = useLocalStorage<{
    [chainId: string]: { [safeAddress: string]: boolean }
  }>(DISMISS_PUSH_NOTIFICATIONS_KEY)

  const dismissPushNotificationBanner = (chainId: string) => {
    const safesOnChain = Object.keys(addedSafes[chainId] || {})

    if (safesOnChain.length === 0) {
      return
    }

    const dismissedSafesOnChain = safesOnChain.reduce<{ [safeAddress: string]: boolean }>((acc, safeAddress) => {
      acc[safeAddress] = true
      return acc
    }, {})

    setDismissedBannerPerChain((prev) => ({
      ...prev,
      [safe.chainId]: dismissedSafesOnChain,
    }))
  }

  const isPushNotificationBannerDismissed = !!dismissedBannerPerChain[safe.chainId]?.[safe.address.value]

  return {
    dismissPushNotificationBanner,
    isPushNotificationBannerDismissed,
  }
}

const getSafesToRegister = (addedSafes: AddedSafesState, allPreferences: PushNotificationPreferences | undefined) => {
  // Regiser all added Safes
  if (!allPreferences) {
    return transformAddedSafes(addedSafes)
  }

  // Only register Safes that are not already registered
  return Object.entries(addedSafes).reduce<NotifiableSafes>((acc, [chainId, addedSafesOnChain]) => {
    const addedSafeAddressesOnChain = Object.keys(addedSafesOnChain)
    const notificationRegistrations = Object.values(allPreferences)

    const newlyAddedSafes = addedSafeAddressesOnChain.filter((safeAddress) => {
      return (
        notificationRegistrations.length === 0 ||
        notificationRegistrations.some((registration) => !sameAddress(registration.safeAddress, safeAddress))
      )
    })

    acc[chainId] = newlyAddedSafes

    return acc
  }, {})
}

export const PushNotificationsBanner = ({ children }: { children: ReactElement }): ReactElement => {
  const isNotificationsEnabled = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const totalAddedSafes = useAppSelector(selectTotalAdded)
  const { safe, safeAddress } = useSafeInfo()
  const { query } = useRouter()
  const onboard = useOnboard()

  const { dismissPushNotificationBanner, isPushNotificationBannerDismissed } = useDismissPushNotificationsBanner()

  const isSafeAdded = !!addedSafes?.[safe.chainId]?.[safeAddress]
  const shouldShowBanner = isNotificationsEnabled && !isPushNotificationBannerDismissed && isSafeAdded

  const { registerNotifications } = useNotificationRegistrations()
  const { getAllPreferences } = useNotificationPreferences()

  const dismissBanner = useCallback(() => {
    trackEvent(PUSH_NOTIFICATION_EVENTS.DISMISS_BANNER)
    dismissPushNotificationBanner(safe.chainId)
  }, [dismissPushNotificationBanner, safe.chainId])

  useEffect(() => {
    if (shouldShowBanner) {
      trackEvent(PUSH_NOTIFICATION_EVENTS.DISPLAY_BANNER)
    }
  }, [dismissBanner, shouldShowBanner])

  const onEnableAll = async () => {
    if (!onboard) {
      return
    }

    trackEvent(PUSH_NOTIFICATION_EVENTS.ENABLE_ALL)

    const allPreferences = getAllPreferences()
    const safesToRegister = getSafesToRegister(addedSafes, allPreferences)

    await assertWalletChain(onboard, safe.chainId)

    await registerNotifications(safesToRegister)

    dismissBanner()
  }

  const onCustomize = () => {
    trackEvent(PUSH_NOTIFICATION_EVENTS.CUSTOMIZE_SETTINGS)

    dismissBanner()
  }

  if (!shouldShowBanner) {
    return children
  }

  return (
    <CustomTooltip
      className={css.banner}
      title={
        <Grid container className={css.container}>
          <Grid item xs={3}>
            <Chip label="New" className={css.chip} />
            <SvgIcon component={PushNotificationIcon} inheritViewBox fontSize="inherit" className={css.icon} />
          </Grid>
          <Grid item xs={9}>
            <Typography variant="subtitle2" fontWeight={700}>
              Enable push notifications
            </Typography>
            <IconButton onClick={dismissBanner} className={css.close}>
              <SvgIcon component={CloseIcon} inheritViewBox color="border" fontSize="small" />
            </IconButton>
            <Typography mt={0.5} mb={1.5} variant="body2">
              Get notified about pending signatures, incoming and outgoing transactions and more when Safe{`{Wallet}`}{' '}
              is in the background or closed.
            </Typography>
            <div className={css.buttons}>
              {totalAddedSafes > 0 && (
                <CheckWallet>
                  {(isOk) => (
                    <Button
                      variant="contained"
                      size="small"
                      className={css.button}
                      onClick={onEnableAll}
                      disabled={!isOk || !onboard}
                    >
                      Enable all
                    </Button>
                  )}
                </CheckWallet>
              )}
              {safe && (
                <Link passHref href={{ pathname: AppRoutes.settings.notifications, query }} onClick={onCustomize}>
                  <Button variant="outlined" size="small" className={css.button}>
                    Customize
                  </Button>
                </Link>
              )}
            </div>
          </Grid>
        </Grid>
      }
      open
    >
      <span>{children}</span>
    </CustomTooltip>
  )
}
