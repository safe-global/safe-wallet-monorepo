import { useCallback, useState } from 'react'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import useDelegate from '@/src/hooks/useDelegate'
import Logger from '@/src/utils/logger'

interface ImportError {
  code: 'VALIDATION' | 'IMPORT' | 'OWNER_VALIDATION'
  message: string
}

interface ImportSuccess {
  success: true
  selected: { address: string; path: string; index: number }
}

interface ImportFailure {
  success: false
}

type ImportResult = ImportSuccess | ImportFailure

export const useImportSeedPhraseAddress = () => {
  const dispatch = useAppDispatch()
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<ImportError | null>(null)
  const { validateAddressOwnership } = useAddressOwnershipValidation()
  const { createDelegate } = useDelegate()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const importAddress = useCallback(
    async (address: string, path: string, index: number, privateKey: string): Promise<ImportResult | ImportFailure> => {
      if (!address || !path || !privateKey) {
        setError({
          code: 'VALIDATION',
          message: 'Invalid address, derivation path, or private key',
        })
        return { success: false }
      }

      setIsImporting(true)
      setError(null)

      try {
        // Validate address ownership
        const validationResult = await validateAddressOwnership(address)
        if (!validationResult.isOwner) {
          setError({
            code: 'OWNER_VALIDATION',
            message: 'This address is not an owner of the Safe Account',
          })
          setIsImporting(false)
          return { success: false }
        }

        // Store the private key
        await storePrivateKey(address, privateKey)

        // Create a delegate for this owner
        try {
          // We don't want to fail the import if delegate creation fails
          // by passing null as the safe address, we are creating a delegate for the chain and not for the safe
          const delegateResult = await createDelegate(privateKey, null)

          if (!delegateResult.success) {
            Logger.error('Failed to create delegate during seed phrase import', delegateResult.error)
          }
        } catch (delegateError) {
          // Log the error but continue with the import
          Logger.error('Error creating delegate during seed phrase import', delegateError)
        }

        await dispatch(
          addSignerWithEffects({
            value: address,
            logoUri: validationResult.ownerInfo?.logoUri || null,
            type: 'private-key',
          }),
        )

        setIsImporting(false)

        return {
          success: true,
          selected: { address, path, index },
        }
      } catch (error) {
        Logger.error('Error importing seed phrase address:', error)
        setError({
          code: 'IMPORT',
          message: 'Failed to import the selected address. Please try again.',
        })
        setIsImporting(false)
        return { success: false }
      }
    },
    [dispatch, validateAddressOwnership, createDelegate],
  )

  return {
    isImporting,
    error,
    clearError,
    importAddress,
  }
}
