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
import {
  DISABLE_FAILED_MESSAGE,
  ENABLE_FAILED_MESSAGE,
  PERMISSION_BLOCKED_MESSAGE,
  PERMISSION_REQUIRED_MESSAGE,
  RETRY_MESSAGE,
  SIGNATURE_REJECTED_MESSAGE,
} from '../constants'
import { isWalletRejection } from '@/utils/wallets'
import { logError } from '@/services/exceptions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import useWallet from '@/hooks/wallets/useWallet'
import type { NotifiableSafes } from '../logic'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { useNotificationsTokenVersion } from './useNotificationsTokenVersion'

type RegistrationError = FetchBaseQueryError | SerializedError

// Turns a failure into user-facing copy: gateway errors carry their own reason, while thrown
// errors are raw JS and stay generic apart from a rejected signature
const getFailureMessage = (prefix: string, error?: RegistrationError | Error): string => {
  if (error instanceof Error && isWalletRejection(error)) {
    return SIGNATURE_REJECTED_MESSAGE
  }

  const reason = error && !(error instanceof Error) ? getRtkQueryErrorMessage(error) : RETRY_MESSAGE

  return `${prefix} ${reason}`
}

const registrationFlow = async (
  registrationFn: Promise<{ data?: unknown; error?: RegistrationError }>,
  callback: () => void,
  onError: (error?: RegistrationError | Error) => void,
): Promise<boolean> => {
  let success = false
  let error: RegistrationError | Error | undefined

  try {
    const response = await registrationFn

    // The gateway returns an empty body on success, so a populated one means failure even on a 2xx.
    // Mutations resolve with { error } rather than rejecting; only payload/signing failures reach the catch
    success = !response.error && isEmpty(response.data)
    error = response.error
  } catch (e) {
    error = asError(e)
    logError(ErrorCodes._633, e)
  }

  if (success) {
    callback()
  } else {
    onError(error)
  }

  return success
}

export const useNotificationRegistrations = (): {
  registerNotifications: (safesToRegister: NotifiableSafes) => Promise<boolean>
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

  const onUnregisterError = (error?: RegistrationError | Error) =>
    showErrorNotification(getFailureMessage(DISABLE_FAILED_MESSAGE, error))

  const registerNotifications = async (safesToRegister: NotifiableSafes) => {
    if (!uuid || !wallet) {
      return false
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
      (error) => showErrorNotification(getFailureMessage(ENABLE_FAILED_MESSAGE, error)),
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
