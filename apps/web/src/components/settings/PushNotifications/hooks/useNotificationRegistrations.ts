import {
  useNotificationsRegisterDeviceV1Mutation,
  useNotificationsUnregisterDeviceV1Mutation,
  useNotificationsUnregisterSafeV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import isEmpty from 'lodash/isEmpty'

import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useNotificationPreferences } from './useNotificationPreferences'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { getRegisterDevicePayload, isPermissionBlocked, requestNotificationPermission } from '../logic'
import { PERMISSION_BLOCKED_MESSAGE, PERMISSION_REQUIRED_MESSAGE } from '../constants'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import useWallet from '@/hooks/wallets/useWallet'
import type { NotifiableSafes } from '../logic'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { useNotificationsTokenVersion } from './useNotificationsTokenVersion'

const registrationFlow = async (
  registrationFn: Promise<{ data?: unknown; error?: unknown }>,
  callback: () => void,
  onError: () => void,
): Promise<boolean> => {
  let success = false

  try {
    const response = await registrationFn

    // RTK mutations return { data, error } or throw on error
    // Gateway will return empty data if the device was (un-)registered successfully
    // @see https://github.com/safe-global/safe-client-gateway-nest/blob/27b6b3846b4ecbf938cdf5d0595ca464c10e556b/src/routes/notifications/notifications.service.ts#L29
    // Success only if no error and data is empty/undefined
    success = !response.error && (isEmpty(response.data) || response.data === undefined)
  } catch (e) {
    logError(ErrorCodes._633, e)
  }

  if (success) {
    callback()
  } else {
    onError()
  }

  return success
}

export const useNotificationRegistrations = (): {
  registerNotifications: (safesToRegister: NotifiableSafes, withSignature?: boolean) => Promise<boolean | undefined>
  unregisterSafeNotifications: (chainId: string, safeAddress: string) => Promise<boolean | undefined>
  unregisterDeviceNotifications: (chainId: string) => Promise<boolean | undefined>
} => {
  const dispatch = useAppDispatch()
  const wallet = useWallet()

  const { setTokenVersion } = useNotificationsTokenVersion()
  const { uuid, createPreferences, deletePreferences, deleteAllChainPreferences } = useNotificationPreferences()

  // RTK mutation hooks
  const [triggerRegisterDevice] = useNotificationsRegisterDeviceV1Mutation()
  const [triggerUnregisterDevice] = useNotificationsUnregisterDeviceV1Mutation()
  const [triggerUnregisterSafe] = useNotificationsUnregisterSafeV1Mutation()

  const showErrorNotification = (message: string) => {
    dispatch(
      showNotification({
        message,
        variant: 'error',
        // Distinct from the success toasts' 'notifications' group so a concurrent success cannot auto-close an error
        groupKey: 'notifications-error',
      }),
    )
  }

  const onUnregisterError = () => showErrorNotification('Failed to disable push notifications. Please try again.')

  const registerNotifications = async (safesToRegister: NotifiableSafes) => {
    if (!uuid || !wallet) {
      return
    }

    // Request permission before the first await so the browser prompt opens within the click's
    // user activation; getToken would otherwise request it after async work, which browsers can auto-deny
    const isGranted = await requestNotificationPermission()

    if (!isGranted) {
      showErrorNotification(isPermissionBlocked() ? PERMISSION_BLOCKED_MESSAGE : PERMISSION_REQUIRED_MESSAGE)
      return false
    }

    const register = async () => {
      const payload = await getRegisterDevicePayload({
        uuid,
        safesToRegister,
        wallet,
      })

      return triggerRegisterDevice({ registerDeviceDto: payload })
    }

    return registrationFlow(
      register(),
      () => {
        createPreferences(safesToRegister)

        const totalRegistered = Object.values(safesToRegister).reduce(
          (acc, safeAddresses) => acc + safeAddresses.length,
          0,
        )

        // Set the token version to V2 to indicate that the user has registered their token for the new notification service
        setTokenVersion(NotificationsTokenVersion.V2, safesToRegister)

        trackEvent({
          ...PUSH_NOTIFICATION_EVENTS.REGISTER_SAFES,
          label: totalRegistered,
        })

        dispatch(
          showNotification({
            message: `You will now receive notifications for ${
              totalRegistered > 1 ? 'these Safe accounts' : 'this Safe account'
            } in your browser.`,
            variant: 'success',
            groupKey: 'notifications',
          }),
        )
      },
      () => showErrorNotification('Failed to enable push notifications. Please try again.'),
    )
  }

  const unregisterSafeNotifications = async (chainId: string, safeAddress: string) => {
    if (uuid) {
      return registrationFlow(
        triggerUnregisterSafe({ chainId, uuid, safeAddress }),
        () => {
          deletePreferences({ [chainId]: [safeAddress] })
          trackEvent(PUSH_NOTIFICATION_EVENTS.UNREGISTER_SAFE)
        },
        onUnregisterError,
      )
    }
  }

  const unregisterDeviceNotifications = async (chainId: string) => {
    if (uuid) {
      return registrationFlow(
        triggerUnregisterDevice({ chainId, uuid }),
        () => {
          deleteAllChainPreferences(chainId)
          trackEvent(PUSH_NOTIFICATION_EVENTS.UNREGISTER_DEVICE)
        },
        onUnregisterError,
      )
    }
  }

  return {
    registerNotifications,
    unregisterSafeNotifications,
    unregisterDeviceNotifications,
  }
}
