import { useCallback } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useGlobalSearchParams } from 'expo-router'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useLazyOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
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
  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string; import_safe?: string }>()
  const activeSafe = useAppSelector(selectActiveSafe)

  const [singleSafeTrigger] = useLazySafesGetSafeV1Query({})
  const [ownerSafesTrigger] = useLazyOwnersGetAllSafesByOwnerV2Query()

  const validateAddressOwnership = useCallback(
    async (address: string): Promise<AddressValidationResult> => {
      if (!glob?.safeAddress && !glob?.chainId && !glob?.import_safe && !activeSafe) {
        return { isOwner: false }
      }

      let safeAddress = glob?.safeAddress
      let chainId = glob?.chainId

      if (activeSafe && !safeAddress) {
        safeAddress = activeSafe.address
      }
      if (activeSafe && !chainId) {
        chainId = activeSafe.chainId
      }

      try {
        if (glob?.import_safe) {
          // Multi-chain validation - check if address owns the specified safe on any chain
          const ownedSafesResult = await ownerSafesTrigger({
            ownerAddress: address,
          }).unwrap()

          // Check if the specified safe address is owned by this address on any chain
          const isOwnerOfSafe = Object.entries(ownedSafesResult || {}).some(([_chainId, safeAddresses]) =>
            safeAddresses.some((addr) => addr.toLowerCase() === safeAddress?.toLowerCase()),
          )

          if (isOwnerOfSafe) {
            // If the address owns the safe, we can return early with a simple confirmation
            // We don't have the full owner info from this endpoint, but we know they're an owner
            return {
              isOwner: true,
              ownerInfo: { value: address } as AddressInfo,
            }
          } else {
            return { isOwner: false }
          }
        } else if (safeAddress && chainId) {
          // Single safe validation
          const result = await singleSafeTrigger({
            safeAddress,
            chainId,
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
    [glob, activeSafe, ownerSafesTrigger, singleSafeTrigger],
  )

  return {
    validateAddressOwnership,
  }
}
