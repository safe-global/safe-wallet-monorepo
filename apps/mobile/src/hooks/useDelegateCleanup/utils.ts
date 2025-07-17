import Logger from '@/src/utils/logger'
import { type Address } from '@/src/types/address'
import { Wallet } from 'ethers'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type DelegatesDeleteDelegateV2ApiArg } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { keyStorageService } from '@/src/services/key-storage'
import { getDelegateKeyId } from '@/src/utils/delegate'
import { withGeneralRetry } from '@/src/utils/retry'

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

      const errorMsg = `Cannot delete private key: ${failedCleanups.join(', ')}. Please check your internet connection and try again.`

      return {
        success: false,
        error: errorMsg,
        failedDelegates,
      }
    }

    return { success: true }
  } catch (error) {
    Logger.error('Delegate notification cleanup failed', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}

/**
 * Removes delegates from the backend transaction service across all chains
 * Uses rate limiting and retry logic to handle 429 errors and improve reliability
 */
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

        // Remove delegate from all chains with improved rate limiting
        const chainRemovalPromises = allChains.map(async (chain, chainIndex) => {
          try {
            // Progressive delay based on chain index and delegate index
            const baseDelay = 300 * chainIndex + 100 * delegateIndex
            if (baseDelay > 0) {
              await sleep(baseDelay)
            }

            // Use retry logic for chain-specific operations
            const result = await withGeneralRetry(async () => {
              // Generate typed data for deletion
              const typedData = getDelegateTypedData(chain.chainId, delegateAddress)

              // Sign the message with the owner's wallet
              const signature = await ownerWallet.signTypedData(typedData.domain, typedData.types, typedData.message)

              // Delete delegate from the backend
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

        // Wait for all chain removals to complete for this delegate
        const chainResults = await Promise.all(chainRemovalPromises)

        // Check if any chain removal failed
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

    // Wait for all delegate removals to complete
    const delegateResults = await Promise.all(removalPromises)

    // Check if any delegate removal failed
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
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}

/**
 * Removes delegate private keys from the keychain
 * This is a cleanup step that should not fail the entire process
 */
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

    // Check if any keychain cleanup failed
    const failedDelegates = keychainResults
      .filter((result) => !result.success)
      .map((result) => result.delegateAddress)
      .filter(Boolean) as Address[]

    if (failedDelegates.length > 0) {
      Logger.warn(`Some delegate keys failed to be removed from keychain`, failedDelegates)
      // Note: We don't fail the entire process for keychain cleanup failures
      // as they are not critical for the user experience
    }

    return { success: true, failedDelegates }
  } catch (error) {
    Logger.error('Delegate keychain cleanup failed', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: true, // Still return success as keychain cleanup is not critical
      error: errorMsg,
      failedDelegates: delegateAddresses,
    }
  }
}
