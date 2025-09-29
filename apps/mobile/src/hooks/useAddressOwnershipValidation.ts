import { useCallback } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useGlobalSearchParams } from 'expo-router'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { selectAllChainsIds } from '@/src/store/chains'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectCurrency } from '@/src/store/settingsSlice'
import { makeSafeId } from '@/src/utils/formatters'
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
  const chainIds = useAppSelector(selectAllChainsIds)
  const activeSafe = useAppSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)

  const [singleSafeTrigger] = useLazySafesGetSafeV1Query({})
  const [manySafesTrigger] = useLazySafesGetOverviewForManyQuery()

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
        let safesData: { owners: { value: string }[] }[] = []

        if (glob?.import_safe) {
          // Multi-chain validation
          const result = await manySafesTrigger({
            safes: chainIds.map((chainId: string) => makeSafeId(chainId, safeAddress as string)),
            currency,
            trusted: true,
            excludeSpam: true,
          }).unwrap()
          safesData = result || []
        } else if (safeAddress && chainId) {
          // Single safe validation
          const result = await singleSafeTrigger({
            safeAddress,
            chainId,
          }).unwrap()
          safesData = result ? [result] : []
        }

        if (safesData.length === 0) {
          return { isOwner: false }
        }

        const owners = extractSignersFromSafes(safesData)
        const ownerInfo = Object.values(owners).find((owner) => owner.value.toLowerCase() === address.toLowerCase())

        return {
          isOwner: !!ownerInfo,
          ownerInfo,
        }
      } catch (error) {
        logger.error('Error validating address ownership:', error)
        return { isOwner: false }
      }
    },
    [glob, activeSafe, chainIds, currency, manySafesTrigger, singleSafeTrigger],
  )

  return {
    validateAddressOwnership,
  }
}
