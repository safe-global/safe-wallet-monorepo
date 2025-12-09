import { useCallback } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useLazyOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectPendingSafe } from '@/src/store/signerImportFlowSlice'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import logger from '@/src/utils/logger'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export interface AddressValidationResult {
  isOwner: boolean
  ownerInfo?: AddressInfo
}

/**
 * Hook for validating if an address is an owner of the current Safe or the same Safe on multiple chains
 *
 * Used by both private key and Ledger import flows
 */
export const useAddressOwnershipValidation = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const pendingSafe = useAppSelector(selectPendingSafe)

  const [singleSafeTrigger] = useLazySafesGetSafeV1Query({})
  const [ownerSafesTrigger] = useLazyOwnersGetAllSafesByOwnerV2Query()

  const validateAddressOwnership = useCallback(
    async (address: string): Promise<AddressValidationResult> => {
      if (!pendingSafe && !activeSafe) {
        return { isOwner: false }
      }

      try {
        if (pendingSafe) {
          // Multi-chain validation - check if address owns the pending safe on any chain
          const ownedSafesResult = await ownerSafesTrigger({
            ownerAddress: address,
          }).unwrap()

          // Check if the pending safe address is owned by this address on any chain
          const isOwnerOfSafe = Object.entries(ownedSafesResult || {}).some(([_chainId, safeAddresses]) =>
            safeAddresses.some((addr) => addr.toLowerCase() === pendingSafe.address.toLowerCase()),
          )

          if (isOwnerOfSafe) {
            return {
              isOwner: true,
              ownerInfo: { value: address } as AddressInfo,
            }
          } else {
            return { isOwner: false }
          }
        } else if (activeSafe) {
          // Single safe validation for active safe
          const result = await singleSafeTrigger({
            safeAddress: activeSafe.address,
            chainId: activeSafe.chainId,
          }).unwrap()

          if (!result) {
            return { isOwner: false }
          }

          const owners = extractSignersFromSafes([result])
          const ownerInfo = Object.values(owners).find((owner) => owner.value.toLowerCase() === address.toLowerCase())

          return {
            isOwner: !!ownerInfo,
            ownerInfo,
          }
        }

        return { isOwner: false }
      } catch (error) {
        logger.error('Error validating address ownership:', error)
        return { isOwner: false }
      }
    },
    [pendingSafe, activeSafe, ownerSafesTrigger, singleSafeTrigger],
  )

  return {
    validateAddressOwnership,
  }
}
