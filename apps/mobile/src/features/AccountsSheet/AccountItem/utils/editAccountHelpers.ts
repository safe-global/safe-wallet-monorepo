import { Address } from '@/src/types/address'
import { AppDispatch } from '@/src/store'
import { removeSigner } from '@/src/store/signersSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { removeSafe, SafesSliceItem } from '@/src/store/safesSlice'
import { setEditMode } from '@/src/store/myAccountsSlice'
import { keyStorageService } from '@/src/services/key-storage'
import Logger from '@/src/utils/logger'
import { CommonActions } from '@react-navigation/native'
import { Alert } from 'react-native'
import { StandardErrorResult, ErrorType, createErrorResult, createSuccessResult } from '@/src/utils/errors'

interface SafesCollection extends Record<string, SafesSliceItem> {}

interface SignersCollection extends Record<string, unknown> {}

export interface SafeNavigationConfig {
  navigation: {
    dispatch: (action: ReturnType<typeof CommonActions.reset>) => void
  }
  activeSafe: { address: Address; chainId: string } | null
  safes: SafesCollection
  dispatch: AppDispatch
}

// Helper function to check if an owner is a signer in other safes
export const isOwnerInOtherSafes = (
  ownerAddress: Address,
  excludeSafeAddress: Address,
  allSafesInfo: SafesCollection,
): boolean => {
  // Check all other safes to see if this owner is a signer
  return Object.entries(allSafesInfo).some(([safeAddr, safeInfo]) => {
    if (safeAddr === excludeSafeAddress) {
      return false // Skip the safe being deleted
    }

    return Object.values(safeInfo).some((deployment) => deployment.owners.some((owner) => owner.value === ownerAddress))
  })
}

// Helper function to check if a safe has owners with private keys
export const getSafeOwnersWithPrivateKeys = (
  safeAddress: Address,
  allSafesInfo: SafesCollection,
  allSigners: SignersCollection,
): Address[] => {
  const safeInfo = allSafesInfo[safeAddress]
  if (!safeInfo) {
    return []
  }

  const ownersWithPrivateKeys: Address[] = []

  // Check all deployments of this safe
  Object.values(safeInfo).forEach((deployment) => {
    deployment.owners.forEach((owner) => {
      const hasPrivateKey = !!allSigners[owner.value]
      if (hasPrivateKey && !ownersWithPrivateKeys.includes(owner.value as Address)) {
        ownersWithPrivateKeys.push(owner.value as Address)
      }
    })
  })

  return ownersWithPrivateKeys
}

// Helper function to get owners that can be safely deleted (not used in other safes)
export const getOwnersToDelete = (
  safeAddress: Address,
  allSafesInfo: SafesCollection,
  allSigners: SignersCollection,
): Address[] => {
  const ownersWithPrivateKeys = getSafeOwnersWithPrivateKeys(safeAddress, allSafesInfo, allSigners)

  return ownersWithPrivateKeys.filter((ownerAddress) => !isOwnerInOtherSafes(ownerAddress, safeAddress, allSafesInfo))
}

// Core private key cleanup logic for a single owner
export const cleanupSinglePrivateKey = async (
  ownerAddress: Address,
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>,
  dispatch: AppDispatch,
): Promise<StandardErrorResult<{ success: true }>> => {
  try {
    // Get the private key for delegate cleanup
    const privateKey = await keyStorageService.getPrivateKey(ownerAddress)
    if (!privateKey) {
      return createErrorResult(ErrorType.STORAGE_ERROR, 'Private key not found for the specified address', null, {
        ownerAddress,
      })
    }

    // Remove delegates (includes notification cleanup)
    const result = await removeAllDelegatesForOwner(ownerAddress, privateKey)

    if (!result.success) {
      return createErrorResult(
        ErrorType.CLEANUP_ERROR,
        result.error?.message || 'Failed to clean up delegates before removing private key',
        result.error,
        { ownerAddress },
      )
    }

    // Remove private key from keychain
    await keyStorageService.removePrivateKey(ownerAddress)

    // Remove from Redux store
    dispatch(removeSigner(ownerAddress))

    return createSuccessResult({ success: true as const })
  } catch (error) {
    return createErrorResult(ErrorType.SYSTEM_ERROR, 'An unexpected error occurred during private key cleanup', error, {
      ownerAddress,
    })
  }
}

// Helper function to clean up private keys for multiple owners
export const cleanupPrivateKeysForOwners = async (
  ownerAddresses: Address[],
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>,
  dispatch: AppDispatch,
): Promise<StandardErrorResult<{ processedCount: number; failures: { address: Address; error: unknown }[] }>> => {
  const failures: { address: Address; error: unknown }[] = []

  for (const ownerAddress of ownerAddresses) {
    const result = await cleanupSinglePrivateKey(ownerAddress, removeAllDelegatesForOwner, dispatch)

    if (!result.success) {
      Logger.error(`Failed to cleanup private key for ${ownerAddress}:`, result.error)
      failures.push({ address: ownerAddress, error: result.error })
    }
  }

  const processedCount = ownerAddresses.length - failures.length

  if (failures.length > 0) {
    return createErrorResult(
      ErrorType.CLEANUP_ERROR,
      `Failed to clean up ${failures.length} out of ${ownerAddresses.length} private keys`,
      failures,
      { processedCount, failures },
    )
  }

  return createSuccessResult({ processedCount, failures })
}

// Helper function to create deletion confirmation message
export const createDeletionMessage = (ownersWithPrivateKeys: Address[], ownersToDelete: Address[]): string => {
  let message = `This account has ${ownersWithPrivateKeys.length} owner(s) with private keys stored on this device.`

  if (ownersToDelete.length > 0) {
    message += ` ${ownersToDelete.length} of these private key(s) will be deleted because they are not used in other safes.`
  }

  if (ownersToDelete.length < ownersWithPrivateKeys.length) {
    const keysToKeep = ownersWithPrivateKeys.length - ownersToDelete.length
    message += ` ${keysToKeep} private key(s) will be kept because they are used as signers in other safes.`
  }

  message += ' This action cannot be undone.'
  return message
}

// Helper function to proceed with safe deletion after cleanup
export const proceedWithSafeDeletion = (
  address: Address,
  { navigation, activeSafe, safes, dispatch }: SafeNavigationConfig,
): void => {
  if (activeSafe?.address === address) {
    const [nextAddress, nextInfo] = Object.entries(safes).find(([addr]) => addr !== address) || [null, null]

    if (nextAddress && nextInfo) {
      const firstChain = Object.keys(nextInfo)[0]
      dispatch(
        setActiveSafe({
          address: nextAddress as Address,
          chainId: firstChain,
        }),
      )
    } else {
      // If we are here it means that the user has deleted all safes
      // We need to reset the navigation to the onboarding screen
      // Otherwise the app will crash as there is no active safe
      navigation.dispatch(
        CommonActions.reset({
          routes: [{ name: 'onboarding' }],
        }),
      )

      dispatch(setEditMode(false))
      dispatch(setActiveSafe(null))
    }
  }

  dispatch(removeSafe(address))
}

interface HandleConfirmedDeletionParams {
  address: Address
  ownersToDelete: Address[]
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>
  navigationConfig: SafeNavigationConfig
  resolve: () => void
  reject: (error: Error) => void
}

// Helper function to handle confirmed deletion with private key cleanup
const handleConfirmedDeletion = async (params: HandleConfirmedDeletionParams) => {
  const { address, ownersToDelete, removeAllDelegatesForOwner, navigationConfig, resolve, reject } = params
  try {
    // Early return if no cleanup needed
    if (ownersToDelete.length === 0) {
      proceedWithSafeDeletion(address, navigationConfig)
      resolve()
      return
    }

    const cleanupResult = await cleanupPrivateKeysForOwners(
      ownersToDelete,
      removeAllDelegatesForOwner,
      navigationConfig.dispatch,
    )

    if (!cleanupResult.success) {
      Logger.error('Failed to clean up private keys during safe deletion:', cleanupResult.error)
      Alert.alert('Error', cleanupResult.error?.message || 'Failed to delete private keys. Please try again.')
      reject(new Error(cleanupResult.error?.message || 'Failed to delete private keys'))
      return
    }

    proceedWithSafeDeletion(address, navigationConfig)
    resolve()
  } catch (error) {
    Logger.error('Failed to clean up private keys during safe deletion:', error)
    Alert.alert('Error', 'Failed to delete private keys. Please try again.')
    reject(error as Error)
  }
}

interface HandleSafeDeletionParams {
  address: Address
  allSafesInfo: SafesCollection
  allSigners: SignersCollection
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>
  navigationConfig: SafeNavigationConfig
}

// Helper function to handle safe deletion with confirmation
export const handleSafeDeletion = async (params: HandleSafeDeletionParams): Promise<void> => {
  const { address, allSafesInfo, allSigners, removeAllDelegatesForOwner, navigationConfig } = params
  const ownersWithPrivateKeys = getSafeOwnersWithPrivateKeys(address, allSafesInfo, allSigners)
  const ownersToDelete = getOwnersToDelete(address, allSafesInfo, allSigners)

  // Early return for simple case - no private keys to clean up
  if (ownersWithPrivateKeys.length === 0) {
    proceedWithSafeDeletion(address, navigationConfig)
    return
  }

  const message = createDeletionMessage(ownersWithPrivateKeys, ownersToDelete)
  const buttonTitle = ownersToDelete.length > 0 ? 'Delete account and private keys' : 'Delete account'

  return new Promise((resolve, reject) => {
    Alert.alert('Delete account', message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => reject(new Error('User cancelled deletion')),
      },
      {
        text: buttonTitle,
        style: 'destructive',
        onPress: () =>
          handleConfirmedDeletion({
            address,
            ownersToDelete,
            removeAllDelegatesForOwner,
            navigationConfig,
            resolve,
            reject,
          }),
      },
    ])
  })
}
