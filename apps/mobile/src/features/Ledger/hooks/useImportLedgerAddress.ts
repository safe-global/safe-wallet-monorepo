import { useCallback, useState } from 'react'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import logger from '@/src/utils/logger'

type ImportError = {
  code: 'VALIDATION' | 'IMPORT' | 'OWNER_VALIDATION'
  message: string
}

interface ImportResult {
  success: true
  selected: {
    address: string
    path: string
    index: number
  }
}

interface ImportFailure {
  success: false
}

export const useImportLedgerAddress = () => {
  const dispatch = useAppDispatch()
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<ImportError | null>(null)
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const importAddress = useCallback(
    async (address: string, path: string, index: number, name: string): Promise<ImportResult | ImportFailure> => {
      if (!address || !path) {
        setError({
          code: 'VALIDATION',
          message: 'Invalid address or derivation path',
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

        let ownerName = validationResult.ownerInfo?.name || null
        if (!ownerName) {
          ownerName = `${name}-${address.slice(-4)}`
        }
        await dispatch(
          addSignerWithEffects({
            value: address,
            name: ownerName,
            logoUri: validationResult.ownerInfo?.logoUri || null,
            type: 'ledger',
            derivationPath: path,
          }),
        )

        await ledgerDMKService.disconnect()
        setIsImporting(false)

        return {
          success: true,
          selected: { address, path, index },
        }
      } catch (error) {
        logger.error('Error importing address:', error)
        setError({
          code: 'IMPORT',
          message: 'Failed to import the selected address. Please try again.',
        })
        setIsImporting(false)
        return { success: false }
      }
    },
    [dispatch, validateAddressOwnership],
  )

  return {
    isImporting,
    error,
    clearError,
    importAddress,
  }
}
