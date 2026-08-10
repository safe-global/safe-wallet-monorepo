import useSafeInfo from '@/hooks/useSafeInfo'
import { useNotificationPreferences } from './useNotificationPreferences'
import { useNotificationRegistrations } from './useNotificationRegistrations'
import { useCallback, useMemo } from 'react'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { useIsNotificationsRenewalEnabled, useNotificationsTokenVersion } from './useNotificationsTokenVersion'
import type { NotifiableSafes } from '../logic'
import { flatten, isEmpty } from 'lodash'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { RENEWAL_NOTIFICATION_KEY } from '../constants'

/**
 * Hook to manage the renewal of notifications
 * @param shouldShowRenewalNotification a boolean to determine if the renewal notification should be shown
 * @returns an object containing the safes for renewal, the number of chains for renewal, the number of safes for renewal,
 * the renewNotifications function and a boolean indicating if a renewal is needed
 */
export const useNotificationsRenewal = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const { registerNotifications } = useNotificationRegistrations()
  const { getAllPreferences, getChainPreferences } = useNotificationPreferences()
  const { allTokenVersions } = useNotificationsTokenVersion()
  const isNotificationsRenewalEnabled = useIsNotificationsRenewalEnabled()
  const dispatch = useAppDispatch()

  /**
   * Function to check if a renewal is needed for a specific Safe based on the locally stored token version
   * @param chainId the chainId of the Safe
   * @param safeAddress the address of the Safe
   * @returns a boolean indicating if a renewal is needed
   */
  const checkIsRenewalNeeded = useCallback(
    (chainId: string, safeAddress: string) =>
      allTokenVersions?.[chainId]?.[safeAddress] !== NotificationsTokenVersion.V2,
    [allTokenVersions],
  )

  // Safes that need to be renewed based on the locally stored token version. If a Safe is loaded, only the relevant
  // Safes for the corresponding chain are returned. Otherwise, all Safes that need to be renewed are returned.
  const safesForRenewal = useMemo<NotifiableSafes | undefined>(() => {
    if (!isNotificationsRenewalEnabled) {
      // Notifications renewal feature flag is not enabled
      return undefined
    }

    if (safeLoaded) {
      // If the Safe is loaded, only the Safes for the corresponding chain are checked
      const chainPreferences = getChainPreferences(safe.chainId)

      // Determine the Safes that need to be renewed for the loaded Safe's chain
      const safeAddressesForRenewal = chainPreferences
        .map((pref) => pref.safeAddress)
        .filter((address) => checkIsRenewalNeeded(safe.chainId, address))

      if (safeAddressesForRenewal.length === 0) {
        return undefined
      }

      return { [safe.chainId]: safeAddressesForRenewal }
    }

    const allPreferences = getAllPreferences()

    if (!allPreferences) {
      return undefined
    }

    // Determine the Safes that need to be renewed for all chains
    const safesForRenewal = Object.values(allPreferences).reduce<NotifiableSafes>(
      (acc, { chainId, safeAddress }) =>
        checkIsRenewalNeeded(chainId, safeAddress)
          ? { ...acc, [chainId]: [...(acc[chainId] || []), safeAddress] }
          : acc,
      {},
    )

    return isEmpty(safesForRenewal) ? undefined : safesForRenewal
  }, [
    safeLoaded,
    safe.chainId,
    getAllPreferences,
    getChainPreferences,
    checkIsRenewalNeeded,
    isNotificationsRenewalEnabled,
  ])

  // Number of Safes that need to be renewed for notifications
  const numberSafesForRenewal = useMemo(() => {
    return safesForRenewal ? flatten(Object.values(safesForRenewal)).length : 0
  }, [safesForRenewal])

  // Number of chains with Safes that need to be renewed for notifications
  const numberChainsForRenewal = useMemo(() => {
    return safesForRenewal ? Object.values(safesForRenewal).filter((addresses) => addresses.length > 0).length : 0
  }, [safesForRenewal])

  // Boolean indicating if a notifications renewal is needed for any Safe
  const needsRenewal = useMemo(() => {
    if (safeLoaded) {
      return safesForRenewal?.[safe.chainId]?.includes(safe.address.value) || false
    }
    return numberSafesForRenewal > 0
  }, [numberSafesForRenewal, safe.address.value, safe.chainId, safeLoaded, safesForRenewal])

  /**
   * Function to renew the notifications for the Safes that need it
   * @returns a Promise that resolves when the notifications have been renewed
   */
  const renewNotifications = useCallback(async () => {
    if (safesForRenewal) {
      return registerNotifications(safesForRenewal).catch((err) => {
        dispatch(
          showNotification({
            message: 'Failed to renew notifications',
            variant: 'error',
            detailedMessage: err.message,
            groupKey: RENEWAL_NOTIFICATION_KEY,
          }),
        )
      })
    }
  }, [safesForRenewal, dispatch, registerNotifications])

  return { safesForRenewal, numberChainsForRenewal, numberSafesForRenewal, renewNotifications, needsRenewal }
}
