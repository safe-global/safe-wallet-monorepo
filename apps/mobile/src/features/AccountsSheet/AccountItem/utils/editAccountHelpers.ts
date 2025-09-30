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
import { Signer } from '@/src/store/signersSlice'

interface SafesCollection extends Record<string, SafesSliceItem> {}

interface SignersCollection extends Record<string, Signer> {}

export interface SafeDeletionContext {
  navigation: {
    dispatch: (action: ReturnType<typeof CommonActions.reset>) => void
  }
  activeSafe: { address: Address; chainId: string } | null
  safes: SafesCollection
}

export const isOwnerInOtherSafes = (
  ownerAddress: Address,
  excludeSafeAddress: Address,
  allSafesInfo: SafesCollection,
): boolean => {
  return Object.entries(allSafesInfo).some(([safeAddr, safeInfo]) => {
    if (safeAddr === excludeSafeAddress) {
      return false
    }

    return Object.values(safeInfo).some((deployment) => deployment.owners.some((owner) => owner.value === ownerAddress))
  })
}

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

export const getOwnersToDelete = (
  safeAddress: Address,
  allSafesInfo: SafesCollection,
  allSigners: SignersCollection,
): Address[] => {
  const ownersWithPrivateKeys = getSafeOwnersWithPrivateKeys(safeAddress, allSafesInfo, allSigners)

  return ownersWithPrivateKeys.filter((ownerAddress) => !isOwnerInOtherSafes(ownerAddress, safeAddress, allSafesInfo))
}

export interface CategorizedOwners {
  privateKeyOwners: Address[]
  ledgerOwners: Address[]
}

export const categorizeOwnersToDelete = (
  safeAddress: Address,
  allSafesInfo: SafesCollection,
  allSigners: SignersCollection,
): CategorizedOwners => {
  const safeInfo = allSafesInfo[safeAddress]
  if (!safeInfo) {
    return { privateKeyOwners: [], ledgerOwners: [] }
  }

  const privateKeyOwners: Address[] = []
  const ledgerOwners: Address[] = []

  Object.values(safeInfo).forEach((deployment) => {
    deployment.owners.forEach((owner) => {
      const signer = allSigners[owner.value]
      if (!signer) {
        return
      }

      const isUsedInOtherSafes = isOwnerInOtherSafes(owner.value as Address, safeAddress, allSafesInfo)
      if (isUsedInOtherSafes) {
        return
      }

      const ownerAddress = owner.value as Address
      if (signer.type === 'private-key' && !privateKeyOwners.includes(ownerAddress)) {
        privateKeyOwners.push(ownerAddress)
      } else if (signer.type === 'ledger' && !ledgerOwners.includes(ownerAddress)) {
        ledgerOwners.push(ownerAddress)
      }
    })
  })

  return { privateKeyOwners, ledgerOwners }
}

export const cleanupSinglePrivateKey = async (
  ownerAddress: Address,
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>,
  dispatch: AppDispatch,
): Promise<StandardErrorResult<{ success: true }>> => {
  try {
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

export const cleanupLedgerSigners = (
  ledgerAddresses: Address[],
  dispatch: AppDispatch,
): StandardErrorResult<{ processedCount: number }> => {
  try {
    ledgerAddresses.forEach((address) => {
      dispatch(removeSigner(address))
    })

    return createSuccessResult({ processedCount: ledgerAddresses.length })
  } catch (error) {
    return createErrorResult(ErrorType.SYSTEM_ERROR, 'Failed to remove Ledger signers from store', error, {
      ledgerAddresses,
    })
  }
}

export const createDeletionMessage = (categorizedOwners: CategorizedOwners): string => {
  const { privateKeyOwners, ledgerOwners } = categorizedOwners
  const totalSigners = privateKeyOwners.length + ledgerOwners.length

  if (totalSigners === 0) {
    return 'This account will be deleted. This action cannot be undone.'
  }

  let message = 'This account has signers that will be affected:'

  if (privateKeyOwners.length > 0) {
    message += ` ${privateKeyOwners.length} private key(s) will be deleted from this device.`
  }

  if (ledgerOwners.length > 0) {
    message += ` ${ledgerOwners.length} Ledger signer(s) will be removed from the app.`
  }

  message += ' This action cannot be undone.'
  return message
}

export const proceedWithSafeDeletion = (
  address: Address,
  deletionContext: SafeDeletionContext,
  reduxDispatch: AppDispatch,
): void => {
  const { navigation, activeSafe, safes } = deletionContext
  if (activeSafe?.address === address) {
    const [nextAddress, nextInfo] = Object.entries(safes).find(([addr]) => addr !== address) || [null, null]

    if (nextAddress && nextInfo) {
      const firstChain = Object.keys(nextInfo)[0]
      reduxDispatch(
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

      reduxDispatch(setEditMode(false))
      reduxDispatch(setActiveSafe(null))
    }
  }

  reduxDispatch(removeSafe(address))
}

interface HandleConfirmedDeletionParams {
  address: Address
  categorizedOwners: CategorizedOwners
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>
  deletionContext: SafeDeletionContext
  reduxDispatch: AppDispatch
  resolve: () => void
  reject: (error: Error) => void
}

const handleConfirmedDeletion = async (params: HandleConfirmedDeletionParams) => {
  const { address, categorizedOwners, removeAllDelegatesForOwner, deletionContext, reduxDispatch, resolve, reject } =
    params
  try {
    const { privateKeyOwners, ledgerOwners } = categorizedOwners
    const hasSignersToDelete = privateKeyOwners.length > 0 || ledgerOwners.length > 0

    if (!hasSignersToDelete) {
      proceedWithSafeDeletion(address, deletionContext, reduxDispatch)
      resolve()
      return
    }

    // Clean up private key signers (with delegate cleanup)
    if (privateKeyOwners.length > 0) {
      const privateKeyCleanupResult = await cleanupPrivateKeysForOwners(
        privateKeyOwners,
        removeAllDelegatesForOwner,
        reduxDispatch,
      )

      if (!privateKeyCleanupResult.success) {
        Logger.error('Failed to clean up private keys during safe deletion:', privateKeyCleanupResult.error)
        Alert.alert(
          'Error',
          privateKeyCleanupResult.error?.message || 'Failed to delete private keys. Please try again.',
        )
        reject(new Error(privateKeyCleanupResult.error?.message || 'Failed to delete private keys'))
        return
      }
    }

    // Clean up Ledger signers (only Redux store removal)
    if (ledgerOwners.length > 0) {
      const ledgerCleanupResult = cleanupLedgerSigners(ledgerOwners, reduxDispatch)

      if (!ledgerCleanupResult.success) {
        Logger.error('Failed to clean up Ledger signers during safe deletion:', ledgerCleanupResult.error)
        Alert.alert('Error', ledgerCleanupResult.error?.message || 'Failed to remove Ledger signers. Please try again.')
        reject(new Error(ledgerCleanupResult.error?.message || 'Failed to remove Ledger signers'))
        return
      }
    }

    proceedWithSafeDeletion(address, deletionContext, reduxDispatch)
    resolve()
  } catch (error) {
    Logger.error('Failed to clean up signers during safe deletion:', error)
    Alert.alert('Error', 'Failed to delete signers. Please try again.')
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
  deletionContext: SafeDeletionContext
  reduxDispatch: AppDispatch
}

export const handleSafeDeletion = async (params: HandleSafeDeletionParams): Promise<void> => {
  const { address, allSafesInfo, allSigners, removeAllDelegatesForOwner, deletionContext, reduxDispatch } = params
  const categorizedOwners = categorizeOwnersToDelete(address, allSafesInfo, allSigners)
  const { privateKeyOwners, ledgerOwners } = categorizedOwners
  const totalSignersToDelete = privateKeyOwners.length + ledgerOwners.length

  if (totalSignersToDelete === 0) {
    proceedWithSafeDeletion(address, deletionContext, reduxDispatch)
    return
  }

  const message = createDeletionMessage(categorizedOwners)
  const buttonTitle = totalSignersToDelete > 0 ? 'Delete account and signers' : 'Delete account'

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
            categorizedOwners,
            removeAllDelegatesForOwner,
            deletionContext,
            reduxDispatch,
            resolve,
            reject,
          }),
      },
    ])
  })
}
