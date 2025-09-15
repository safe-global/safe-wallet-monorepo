import { useCallback, useState } from 'react'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'

type ImportError = {
  code: 'VALIDATION' | 'IMPORT'
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

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const importAddress = useCallback(
    async (address: string, path: string, index: number): Promise<ImportResult | ImportFailure> => {
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
        await dispatch(
          addSignerWithEffects({
            value: address,
            name: null,
            logoUri: null,
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
        console.error('Error importing address:', error)
        setError({
          code: 'IMPORT',
          message: 'Failed to import the selected address. Please try again.',
        })
        setIsImporting(false)
        return { success: false }
      }
    },
    [dispatch],
  )

  return {
    isImporting,
    error,
    clearError,
    importAddress,
  }
}
