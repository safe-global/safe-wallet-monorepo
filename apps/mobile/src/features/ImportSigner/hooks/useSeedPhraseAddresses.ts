import { useCallback } from 'react'
import { ethers, HDNodeWallet, Mnemonic } from 'ethers'
import Logger from '@/src/utils/logger'
import { useAddresses, type BaseAddress } from '@/src/hooks/useAddresses'

export interface SeedPhraseAddress extends BaseAddress {
  address: string
  path: string
  index: number
}

interface UseSeedPhraseAddressesParams {
  seedPhrase: string
}

export const useSeedPhraseAddresses = ({ seedPhrase }: UseSeedPhraseAddressesParams) => {
  const validateSeedPhrase = useCallback((): { isValid: boolean; error?: { code: string; message: string } } => {
    if (!seedPhrase) {
      return {
        isValid: false,
        error: { code: 'VALIDATION', message: 'No seed phrase provided' },
      }
    }

    return { isValid: true }
  }, [seedPhrase])

  const deriveAddresses = useCallback(
    async (count: number, startIndex: number): Promise<SeedPhraseAddress[]> => {
      // Create mnemonic from seed phrase
      const mnemonic = Mnemonic.fromPhrase(seedPhrase)
      const addresses: SeedPhraseAddress[] = []

      // Derive addresses using MetaMask-compatible derivation path
      for (let i = startIndex; i < startIndex + count; i++) {
        // Metamask compatible derivation path
        const path = ethers.getIndexedAccountPath(i)

        try {
          // Create HD wallet with the specific path for each address
          const derivedWallet = HDNodeWallet.fromMnemonic(mnemonic, path)
          addresses.push({
            address: derivedWallet.address,
            path,
            index: i,
          })
        } catch (error) {
          Logger.error(`Failed to derive address at index ${i}:`, error)
          // Continue with next address instead of failing completely
          continue
        }
      }

      return addresses
    },
    [seedPhrase],
  )

  const { addresses, isLoading, error, clearError, loadAddresses } = useAddresses({
    fetchAddresses: deriveAddresses,
    validateInput: validateSeedPhrase,
  })

  const deriveAddressesWrapper = useCallback(
    async (count: number) => {
      try {
        await loadAddresses(count)
      } catch (error) {
        Logger.error('Error deriving addresses from seed phrase:', error)
      }
    },
    [loadAddresses],
  )

  const getPrivateKeyForAddress = useCallback(
    (address: string, index: number): string | null => {
      try {
        const mnemonic = Mnemonic.fromPhrase(seedPhrase)
        const path = ethers.getIndexedAccountPath(index)
        const derivedWallet = HDNodeWallet.fromMnemonic(mnemonic, path)

        if (derivedWallet.address.toLowerCase() === address.toLowerCase()) {
          return derivedWallet.privateKey
        }

        return null
      } catch (error) {
        Logger.error('Error getting private key for address:', error)
        return null
      }
    },
    [seedPhrase],
  )

  return {
    addresses,
    isLoading,
    error,
    clearError,
    deriveAddresses: deriveAddressesWrapper,
    getPrivateKeyForAddress,
  }
}
