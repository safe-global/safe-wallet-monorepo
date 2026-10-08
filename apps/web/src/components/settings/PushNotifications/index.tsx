import { useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '@/components/common/EthHashInfo'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { useNotificationRegistrations } from './hooks/useNotificationRegistrations'
import { useNotificationPreferences } from './hooks/useNotificationPreferences'
import { GlobalPushNotifications } from './GlobalPushNotifications'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { IS_DEV } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useIsMac } from '@/hooks/useIsMac'
import { Permission } from '@/permissions/config'
import { useIsAboveLg } from '@/hooks/useMediaQuery'

import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import NotificationRenewal from '@/components/notification-center/NotificationRenewal'
import { PushNotificationsView } from '@views/components/settings/PushNotifications/PushNotificationsView'

export const PushNotifications = (): ReactElement => {
  const { safe, safeLoaded } = useSafeInfo()
  const isOwner = useIsSafeOwner()
  const isMac = useIsMac()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUpdatingIndexedDb, setIsUpdatingIndexedDb] = useState(false)
  const isLargeScreen = useIsAboveLg()

  const { updatePreferences, getPreferences, getAllPreferences } = useNotificationPreferences()
  const { unregisterSafeNotifications, unregisterDeviceNotifications, registerNotifications } =
    useNotificationRegistrations()

  const preferences = getPreferences(safe.chainId, safe.address.value)

  const setPreferences = (newPreferences: NonNullable<ReturnType<typeof getPreferences>>) => {
    setIsUpdatingIndexedDb(true)

    updatePreferences(safe.chainId, safe.address.value, newPreferences)

    setIsUpdatingIndexedDb(false)
  }

  const shouldShowMacHelper = isMac || IS_DEV

  const handleOnChange = async () => {
    setIsRegistering(true)

    if (!preferences) {
      await registerNotifications({ [safe.chainId]: [safe.address.value] })
      trackEvent(PUSH_NOTIFICATION_EVENTS.ENABLE_SAFE)
      setIsRegistering(false)
      return
    }

    const allPreferences = getAllPreferences()
    const totalRegisteredSafesOnChain = allPreferences
      ? Object.values(allPreferences).filter(({ chainId }) => chainId === safe.chainId).length
      : 0
    const shouldUnregisterDevice = totalRegisteredSafesOnChain === 1

    if (shouldUnregisterDevice) {
      await unregisterDeviceNotifications(safe.chainId)
    } else {
      await unregisterSafeNotifications(safe.chainId, safe.address.value)
    }

    trackEvent(PUSH_NOTIFICATION_EVENTS.DISABLE_SAFE)
    setIsRegistering(false)
  }

  return (
    <PushNotificationsView
      safeLoaded={safeLoaded}
      isDeployed={safe.deployed}
      isOwner={isOwner}
      shouldShowMacHelper={shouldShowMacHelper}
      isRegistering={isRegistering}
      isUpdatingIndexedDb={isUpdatingIndexedDb}
      notificationRenewal={<NotificationRenewal />}
      renderNetworkWarning={(props) => <NetworkWarning {...props} />}
      safeAddressInfo={
        <EthHashInfo
          address={safe.address.value}
          showCopyButton
          shortAddress={!isLargeScreen}
          showName={true}
          hasExplorer
        />
      }
      renderCheckWallet={(render) => (
        <CheckWalletWithPermission
          permission={Permission.EnablePushNotifications}
          checkNetwork={!isRegistering && safe.deployed}
        >
          {render}
        </CheckWalletWithPermission>
      )}
      globalPushNotifications={<GlobalPushNotifications />}
      preferences={
        preferences && {
          incomingTxs: preferences[WebhookType.INCOMING_ETHER] && preferences[WebhookType.INCOMING_TOKEN],
          outgoingTxs:
            preferences[WebhookType.MODULE_TRANSACTION] && preferences[WebhookType.EXECUTED_MULTISIG_TRANSACTION],
          confirmationRequests: preferences[WebhookType.CONFIRMATION_REQUEST],
        }
      }
      onToggleNotifications={handleOnChange}
      onIncomingTxsChange={(checked) => {
        if (!preferences) return
        setPreferences({
          ...preferences,
          [WebhookType.INCOMING_ETHER]: checked,
          [WebhookType.INCOMING_TOKEN]: checked,
        })

        trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_INCOMING_TXS, label: checked })
      }}
      onOutgoingTxsChange={(checked) => {
        if (!preferences) return
        setPreferences({
          ...preferences,
          [WebhookType.MODULE_TRANSACTION]: checked,
          [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: checked,
        })

        trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_OUTGOING_TXS, label: checked })
      }}
      onConfirmationRequestsChange={(checked) => {
        if (!preferences) return
        const updateConfirmationRequestPreferences = () => {
          setPreferences({
            ...preferences,
            [WebhookType.CONFIRMATION_REQUEST]: checked,
          })

          trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_CONFIRMATION_REQUEST, label: checked })
        }

        if (checked) {
          registerNotifications({
            [safe.chainId]: [safe.address.value],
          })
            .then((registered) => {
              if (registered) {
                updateConfirmationRequestPreferences()
              }
            })
            .catch(() => null)
        } else {
          updateConfirmationRequestPreferences()
        }
      }}
    />
  )
}
