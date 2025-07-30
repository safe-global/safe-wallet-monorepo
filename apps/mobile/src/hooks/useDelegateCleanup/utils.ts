import Logger from '@/src/utils/logger'
import { type Address } from '@/src/types/address'
import { Wallet } from 'ethers'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type DelegatesDeleteDelegateV2ApiArg } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { keyStorageService } from '@/src/services/key-storage'
import { getDelegateKeyId } from '@/src/utils/delegate'
import { withGeneralRetry } from '@/src/utils/retry'
import { asError } from '@safe-global/utils/services/exceptions/utils'

// Types for cleanup results
interface CleanupResult {
  success: boolean
  error?: {
    message: string
    code?: string
  }
}

interface NotificationCleanupResult {
  success: boolean
  error?: string
  failedDelegates?: Address[]
}

interface DelegateRemovalResult {
  success: boolean
  error?: string
  failedDelegates?: Address[]
}

interface KeychainCleanupResult {
  success: boolean
  error?: string
  failedDelegates?: Address[]
}

/**
 * Cleans up notifications for all delegates of a given owner
 * This is a critical step that must succeed before proceeding with delegate removal
 *
 * If we don't manage to unsubscribe the user, but just proceed and delete the key
 * the user is going to receive push notifications for this safe, which can get quite annoying
 */
export const cleanupDelegateNotifications = async (
  ownerAddress: Address,
  delegateAddresses: Address[],
  cleanupNotificationsForDelegate: (ownerAddress: Address, delegateAddress: Address) => Promise<CleanupResult>,
): Promise<NotificationCleanupResult> => {
  if (!delegateAddresses || delegateAddresses.length === 0) {
    return { success: true }
  }

  try {
    const notificationCleanupResults = await Promise.allSettled(
      delegateAddresses.map(async (delegateAddress) => {
        try {
          const result = await cleanupNotificationsForDelegate(ownerAddress, delegateAddress)
          if (!result.success && result.error) {
            throw new Error(`Notification cleanup failed for ${delegateAddress}: ${result.error.message}`)
          }
          return result
        } catch (error) {
          Logger.error(`Failed to cleanup notifications for delegate ${delegateAddress}`, error)
          throw error
        }
      }),
    )

    // Check if any notification cleanup failed with blocking errors
    const failedCleanups = notificationCleanupResults
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason)

    if (failedCleanups.length > 0) {
      const failedDelegates = delegateAddresses.filter(
        (_, index) => notificationCleanupResults[index].status === 'rejected',
      )

      const errorMsg = `Cannot delete private key: ${failedCleanups.join(
        ', ',
      )}. Please check your internet connection and try again.`

      return {
        success: false,
        error: errorMsg,
        failedDelegates,
      }
    }

    return { success: true }
  } catch (error) {
    Logger.error('Delegate notification cleanup failed', error)
    const errorMsg = asError(error).message
    return {
      success: false,
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}

export const removeDelegatesFromBackend = async (
  ownerAddress: Address,
  delegateAddresses: Address[],
  ownerWallet: Wallet,
  allChains: Chain[],
  deleteDelegate: (params: DelegatesDeleteDelegateV2ApiArg) => Promise<unknown>,
): Promise<DelegateRemovalResult> => {
  if (!delegateAddresses || delegateAddresses.length === 0) {
    return { success: true }
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    const removalPromises = delegateAddresses.map(async (delegateAddress, delegateIndex) => {
      try {
        // Stagger delegate processing to avoid overwhelming the backend
        if (delegateIndex > 0) {
          await sleep(500 * delegateIndex)
        }

        const chainRemovalPromises = allChains.map(async (chain, chainIndex) => {
          try {
            const baseDelay = 300 * chainIndex + 100 * delegateIndex
            if (baseDelay > 0) {
              await sleep(baseDelay)
            }

            const result = await withGeneralRetry(async () => {
              const typedData = getDelegateTypedData(chain.chainId, delegateAddress)

              const signature = await ownerWallet.signTypedData(typedData.domain, typedData.types, typedData.message)

              await deleteDelegate({
                chainId: chain.chainId,
                delegateAddress,
                deleteDelegateV2Dto: {
                  delegator: ownerAddress,
                  signature,
                },
              })

              return { success: true, chainId: chain.chainId }
            }, 3)

            return result
          } catch (error) {
            Logger.error(`Failed to remove delegate from chain ${chain.chainId} after retries`, error)
            return { success: false, chainId: chain.chainId, error }
          }
        })

        const chainResults = await Promise.all(chainRemovalPromises)

        const failedChains = chainResults.filter((result) => !result.success)
        const successfulChains = chainResults.filter((result) => result.success).length

        if (failedChains.length > 0) {
          Logger.warn(`Some chains failed for delegate ${delegateAddress}`, {
            delegateAddress,
            failedChains: failedChains.map((r) => r.chainId),
            totalChains: allChains.length,
          })
        }

        Logger.info(`Delegate ${delegateAddress} removed from ${successfulChains}/${allChains.length} chains`)

        // If all chains failed, consider the delegate removal failed
        if (successfulChains === 0) {
          return { success: false, delegateAddress, error: new Error('Failed to remove delegate from all chains') }
        }

        return { success: true, delegateAddress }
      } catch (error) {
        Logger.error(`Failed to remove delegate ${delegateAddress}`, error)
        return { success: false, delegateAddress, error }
      }
    })

    const delegateResults = await Promise.all(removalPromises)

    const failedDelegates = delegateResults
      .filter((result) => !result.success)
      .map((result) => result.delegateAddress)
      .filter(Boolean) as Address[]

    if (failedDelegates.length > 0) {
      Logger.warn(`Some delegates failed to be removed from backend`, {
        failedDelegates,
        totalDelegates: delegateAddresses.length,
      })
      return {
        success: false,
        error: `Failed to remove ${failedDelegates.length} out of ${delegateAddresses.length} delegates from backend`,
        failedDelegates,
      }
    }

    Logger.info(`Successfully removed all ${delegateAddresses.length} delegates from backend`)
    return { success: true }
  } catch (error) {
    Logger.error('Delegate backend removal failed', error)
    const errorMsg = asError(error).message
    return {
      success: false,
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}

export const cleanupDelegateKeychain = async (
  ownerAddress: Address,
  delegateAddresses: Address[],
): Promise<KeychainCleanupResult> => {
  if (!delegateAddresses || delegateAddresses.length === 0) {
    return { success: true }
  }

  try {
    const keychainCleanupPromises = delegateAddresses.map(async (delegateAddress) => {
      try {
        const delegateKeyId = getDelegateKeyId(ownerAddress, delegateAddress)
        await keyStorageService.removePrivateKey(delegateKeyId, { requireAuthentication: false })
        return { success: true, delegateAddress }
      } catch (error) {
        Logger.warn(`Failed to remove delegate key from keychain: ${delegateAddress}`, error)
        return { success: false, delegateAddress, error }
      }
    })

    const keychainResults = await Promise.all(keychainCleanupPromises)

    const failedDelegates = keychainResults
      .filter((result) => !result.success)
      .map((result) => result.delegateAddress)
      .filter(Boolean) as Address[]

    if (failedDelegates.length > 0) {
      Logger.warn(`Some delegate keys failed to be removed from keychain`, failedDelegates)
      // Note: We don't fail the entire process for keychain cleanup failures
      // as delegate remove on the backend is not critical for the user experience
    }

    return { success: true, failedDelegates }
  } catch (error) {
    Logger.error('Delegate keychain cleanup failed', error)
    const errorMsg = asError(error).message
    return {
      success: true, // Still return success as delegate removal on the backend is not critical
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}
