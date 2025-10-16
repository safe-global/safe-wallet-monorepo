import { useCallback } from 'react'

import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { ledgerEthereumService } from '@/src/services/ledger/ledger-ethereum.service'
import logger from '@/src/utils/logger'
import { useAddresses, type BaseAddress } from '@/src/hooks/useAddresses'

interface UseLedgerAddressesParams {
  sessionId?: string
}

export const useLedgerAddresses = ({ sessionId }: UseLedgerAddressesParams) => {
  const validateSession = useCallback((): { isValid: boolean; error?: { code: string; message: string } } => {
    if (!sessionId) {
      return {
        isValid: false,
        error: { code: 'SESSION', message: 'No device session found' },
      }
    }

    const session = ledgerDMKService.getCurrentSession()
    if (!session || session !== sessionId) {
      return {
        isValid: false,
        error: { code: 'SESSION', message: 'Device session not found or expired' },
      }
    }

    return { isValid: true }
  }, [sessionId])

  const fetchAddresses = useCallback(async (count: number, startIndex: number): Promise<BaseAddress[]> => {
    const session = ledgerDMKService.getCurrentSession()
    if (!session) {
      throw new Error('No session available')
    }

    const addresses = await ledgerEthereumService.getEthereumAddresses(session, count, startIndex)
    return addresses.map((a) => ({ address: a.address, path: a.path, index: a.index }))
  }, [])

  const { addresses, isLoading, error, clearError, loadAddresses } = useAddresses({
    fetchAddresses,
    validateInput: validateSession,
  })

  const fetchAddressesWrapper = useCallback(
    async (count: number) => {
      try {
        await loadAddresses(count)
      } catch (error) {
        logger.error('Error loading addresses:', error)
      }
    },
    [loadAddresses],
  )

  return {
    addresses,
    isLoading,
    error,
    clearError,
    fetchAddresses: fetchAddressesWrapper,
  }
}
