import { type Address } from '@/src/types/address'
import { type RootState } from '@/src/store'
import { selectAllDelegatesForSafeOwners } from '@/src/store/delegatesSlice'
import Logger from '@/src/utils/logger'

export interface NotificationCleanupError {
  type: 'safe' | 'blocking'
  message: string
  originalError: unknown
}

export interface SafeNotificationInfo {
  address: string
  chainIds: string[]
}

/**
 * Classifies errors to determine if they should block private key deletion
 */
export const classifyNotificationError = (error: unknown): NotificationCleanupError => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status

    // Safe errors - don't block deletion
    if (status === 404 || status === 410) {
      return {
        type: 'safe',
        message: 'Subscription already removed',
        originalError: error,
      }
    }

    // Blocking errors - prevent deletion
    if (status >= 500 || status === 401 || status === 403) {
      return {
        type: 'blocking',
        message: `Server error (${status}): Cannot verify subscription removal`,
        originalError: error,
      }
    }

    // Rate limiting - blocking but with retry suggestion
    if (status === 429) {
      return {
        type: 'blocking',
        message: 'Rate limited: Too many requests. Please try again in a moment.',
        originalError: error,
      }
    }
  }

  // Network errors, timeouts, etc. - blocking by default
  return {
    type: 'blocking',
    message: 'Network error: Cannot verify subscription removal',
    originalError: error,
  }
}

export const getAffectedSafes = (
  ownerAddress: Address,
  allSafes: RootState['safes'],
  allChains: { chainId: string }[],
  safeSubscriptions: RootState['safeSubscriptions'],
): SafeNotificationInfo[] => {
  const affectedSafes: SafeNotificationInfo[] = []

  Object.entries(allSafes).forEach(([safeAddress, chainDeployments]) => {
    // Check if this owner is part of this safe
    const isOwner = Object.values(chainDeployments).some((deployment) =>
      deployment.owners.some((owner) => owner.value === ownerAddress),
    )

    if (isOwner) {
      // Get chains where this safe is subscribed to notifications
      const subscribedChains = allChains
        .map((chain) => chain.chainId)
        .filter((chainId) => {
          const subscriptionStatus = safeSubscriptions[safeAddress]?.[chainId]
          return subscriptionStatus === true
        })

      if (subscribedChains.length > 0) {
        affectedSafes.push({
          address: safeAddress,
          chainIds: subscribedChains,
        })
      }
    }
  })

  return affectedSafes
}

export const hasOtherDelegates = (
  safeAddress: Address,
  excludeDelegateAddress: Address,
  state: Pick<RootState, 'safes' | 'delegates'>,
): boolean => {
  const allSafeDelegates = selectAllDelegatesForSafeOwners(state, safeAddress)
  return allSafeDelegates.some((delegate) => delegate.delegateAddress !== excludeDelegateAddress)
}

export const createSubscriptionData = async (
  safeAddress: string,
  chainIds: string[],
  deviceUuid: string,
  delegateAddress?: string,
) => {
  return chainIds.map((chainId) => ({
    chainId,
    deviceUuid,
    safeAddress,
    ...(delegateAddress && { signerAddress: delegateAddress }),
  }))
}

/**
 * Clears authentication cookies before making non-authenticated API calls.
 * This is a workaround for the React Native bug where credentials: 'omit' is ignored
 * on Android and cookies are always sent.
 *
 * We do inline import to avoid circular dependency.
 *
 * @see https://github.com/facebook/react-native/issues/12956
 */
export const clearAuthBeforeUnauthenticatedCall = async (): Promise<void> => {
  try {
    const { cgwApi: authApi } = await import('@safe-global/store/gateway/AUTO_GENERATED/auth')
    const { getStore } = await import('@/src/store/utils/singletonStore')

    await getStore().dispatch(authApi.endpoints.authLogoutV1.initiate()).unwrap()

    Logger.info('Cleared authentication cookies for unauthenticated API call')
  } catch (error) {
    // Logout failure shouldn't block the main operation
    Logger.warn('Failed to clear authentication cookies', { error })
  }
}
