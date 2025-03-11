import { useCallback } from 'react'
import { useWalletContext } from './useWallet'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { useNestedSafeOwners } from '../useNestedSafeOwners'
import { getAvailableSigners } from '@/utils/signers'
import { sameAddress } from '@/utils/addresses'

/**
 *
 * @returns a function that sets a signer that can sign the given transaction in the given Safe
 */
export const useSelectAvailableSigner = () => {
  const { connectedWallet: wallet, setSignerAddress, signer } = useWalletContext() ?? {}
  const nestedSafeOwners = useNestedSafeOwners()

  return useCallback(
    (tx: SafeTransaction | undefined, safe: SafeInfo) => {
      const availableSigners = getAvailableSigners(wallet, nestedSafeOwners, safe, tx)

      if (!signer || !availableSigners.some((available) => sameAddress(available, signer.address))) {
        setSignerAddress?.(availableSigners[0])
      }
    },
    [wallet, nestedSafeOwners, signer, setSignerAddress],
  )
}
