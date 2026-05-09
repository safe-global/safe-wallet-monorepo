import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import type { NotifiableSafes } from '../logic'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

export const NOTIFICATIONS_TOKEN_VERSION_KEY = 'notificationsTokenVersion'

type TokenVersionStore = {
  [chainId: string]: {
    [safeAddress: string]: NotificationsTokenVersion | undefined
  }
}

export const useIsNotificationsRenewalEnabled = () => {
  return useHasFeature(FEATURES.RENEW_NOTIFICATIONS_TOKEN)
}

/**
 * Hook to get and update the token versions for the notifications in the local storage.
 * @returns an object with the token version for the current loaded Safe, all token versions stored in the local storage,
 * and a function to update the token version.
 */
export const useNotificationsTokenVersion = () => {
  const isNotificationsRenewalEnabled = useIsNotificationsRenewalEnabled()
  const { safe, safeLoaded } = useSafeInfo()
  const safeAddress = safe.address.value

  // Token versions are stored in local storage
  const [allTokenVersions, setAllTokenVersionsStore] = useLocalStorage<TokenVersionStore>(
    NOTIFICATIONS_TOKEN_VERSION_KEY,
  )

  /**
   * Updates the token version for the specified Safes in the local storage.
   * @param tokenVersion new token version
   * @param safes object with Safes to update the token version. If not provided, the token version will be
   * updated for the current loaded Safe only.
   */
  const setTokenVersion = (
    tokenVersion: NotificationsTokenVersion | undefined,
    safes: NotifiableSafes | undefined = safeLoaded ? { [safe.chainId]: [safeAddress] } : undefined,
  ) => {
    const currentTokenVersionStore = allTokenVersions || {}

    if (!isNotificationsRenewalEnabled) {
      // Notifications renewal is not enabled, nothing to update
      return
    }

    if (!safes) {
      // No Safes provided and no Safe loaded, nothing to update
      return
    }

    // Update the token version for the provided Safes
    const newTokenVersionStore = Object.keys(safes).reduce(
      (acc, chainId) => ({
        ...acc,
        [chainId]: {
          ...(acc[chainId] || {}),
          ...Object.fromEntries(safes[chainId].map((safeAddress) => [safeAddress, tokenVersion])),
        },
      }),
      currentTokenVersionStore,
    )

    setAllTokenVersionsStore(newTokenVersionStore)
  }

  if (!isNotificationsRenewalEnabled) {
    // Notifications renewal is not enabled, no token versions stored
    return { safeTokenVersion: undefined, allTokenVersions: undefined, setTokenVersion }
  }

  if (!allTokenVersions) {
    // No token versions stored
    return { safeTokenVersion: undefined, allTokenVersions, setTokenVersion }
  }

  // Get the stored token version for the current loaded Safe
  const safeTokenVersion = safeLoaded ? allTokenVersions[safe.chainId]?.[safeAddress] : undefined

  return { safeTokenVersion, allTokenVersions, setTokenVersion }
}
