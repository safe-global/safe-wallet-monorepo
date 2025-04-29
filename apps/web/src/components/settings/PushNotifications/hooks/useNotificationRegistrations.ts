import { registerDevice, unregisterDevice, unregisterSafe } from '@safe-global/safe-gateway-typescript-sdk'
import isEmpty from 'lodash/isEmpty'

import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useNotificationPreferences } from './useNotificationPreferences'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { getRegisterDevicePayload } from '../logic'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import useWallet from '@/hooks/wallets/useWallet'
import type { NotifiableSafes } from '../logic'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { useNotificationsTokenVersion } from './useNotificationsTokenVersion'

const registrationFlow = async (registrationFn: Promise<unknown>, callback: () => void): Promise<boolean> => {
  let success = false

  try {
    const response = await registrationFn

    // Gateway will return 200 with an empty payload if the device was (un-)registered successfully
    // @see https://github.com/safe-global/safe-client-gateway-nest/blob/27b6b3846b4ecbf938cdf5d0595ca464c10e556b/src/routes/notifications/notifications.service.ts#L29
    success = isEmpty(response)
  } catch (e) {
    logError(ErrorCodes._633, e)
  }

  if (success) {
    callback()
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

  const registerNotifications = async (safesToRegister: NotifiableSafes) => {
    if (!uuid || !wallet) {
      return
    }

    const register = async () => {
      const payload = await getRegisterDevicePayload({
        uuid,
        safesToRegister,
        wallet,
      })

      return registerDevice(payload)
    }

    return registrationFlow(register(), () => {
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
            totalRegistered > 1 ? 'these Safe Accounts' : 'this Safe Account'
          } in your browser.`,
          variant: 'success',
          groupKey: 'notifications',
        }),
      )
    })
  }

  const unregisterSafeNotifications = async (chainId: string, safeAddress: string) => {
    if (uuid) {
      return registrationFlow(unregisterSafe(chainId, safeAddress, uuid), () => {
        deletePreferences({ [chainId]: [safeAddress] })
        trackEvent(PUSH_NOTIFICATION_EVENTS.UNREGISTER_SAFE)
      })
    }
  }

  const unregisterDeviceNotifications = async (chainId: string) => {
    if (uuid) {
      return registrationFlow(unregisterDevice(chainId, uuid), () => {
        deleteAllChainPreferences(chainId)
        trackEvent(PUSH_NOTIFICATION_EVENTS.UNREGISTER_DEVICE)
      })
    }
  }

  return {
    registerNotifications,
    unregisterSafeNotifications,
    unregisterDeviceNotifications,
  }
}
