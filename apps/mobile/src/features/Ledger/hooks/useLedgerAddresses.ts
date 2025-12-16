import { useCallback } from 'react'

import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { ledgerEthereumService } from '@/src/services/ledger/ledger-ethereum.service'
import logger from '@/src/utils/logger'
import { useAddresses, type BaseAddress } from '@/src/hooks/useAddresses'

export type DerivationPathType = 'ledger-live' | 'legacy-ledger'

interface UseLedgerAddressesParams {
  sessionId?: string
  derivationPathType?: DerivationPathType
}

export const useLedgerAddresses = ({ sessionId, derivationPathType = 'ledger-live' }: UseLedgerAddressesParams) => {
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

  const fetchAddresses = useCallback(
    async (count: number, startIndex: number, pathType?: DerivationPathType): Promise<BaseAddress[]> => {
      const session = ledgerDMKService.getCurrentSession()
      if (!session) {
        throw new Error('No session available')
      }

      const typeToUse = pathType ?? derivationPathType
      const addresses = await ledgerEthereumService.getEthereumAddresses(session, count, startIndex, typeToUse)
      return addresses.map((a) => ({ address: a.address, path: a.path, index: a.index }))
    },
    [derivationPathType],
  )

  const { addresses, isLoading, error, clearError, loadAddresses, clearAddresses } = useAddresses({
    fetchAddresses,
    validateInput: validateSession,
  })

  const fetchAddressesWrapper = useCallback(
    async (count: number, startIndex?: number, pathType?: DerivationPathType) => {
      try {
        await loadAddresses(count, startIndex, pathType)
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
    clearAddresses,
  }
}
