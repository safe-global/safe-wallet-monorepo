import { useCallback } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectPendingSafe } from '@/src/store/signerImportFlowSlice'
import { selectAllChainsIds } from '@/src/store/chains'
import { selectCurrency } from '@/src/store/settingsSlice'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import { useLazySafeOverviews } from '@/src/hooks/services/useLazySafeOverviews'
import { makeSafeId } from '@/src/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import logger from '@/src/utils/logger'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export interface AddressValidationResult {
  isOwner: boolean
  ownerInfo?: AddressInfo
}

const findOwner = (safes: { owners: AddressInfo[] }[], address: string): AddressValidationResult => {
  const owners = extractSignersFromSafes(safes)
  const ownerInfo = Object.values(owners).find((owner) => sameAddress(owner.value, address))
  return { isOwner: !!ownerInfo, ownerInfo }
}

/**
 * Hook for validating if an address is an owner of the current Safe (post-onboarding)
 * or of the Safe currently being added during the import flow (pre-onboarding).
 *
 * Used by WalletConnect, Ledger, and seed-phrase signer imports.
 */
export const useAddressOwnershipValidation = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const pendingSafe = useAppSelector(selectPendingSafe)
  const chainIds = useAppSelector(selectAllChainsIds)
  const currency = useAppSelector(selectCurrency)

  const [singleSafeTrigger] = useLazySafesGetSafeV1Query({})
  const [overviewsTrigger] = useLazySafeOverviews()

  const validateAddressOwnership = useCallback(
    async (address: string): Promise<AddressValidationResult> => {
      try {
        if (pendingSafe) {
          // Match the args used by AddSignersForm.container.tsx so RTK Query reuses its cached entry.
          const safes = chainIds.map((chainId) => makeSafeId(chainId, pendingSafe.address))
          const overviews = await overviewsTrigger({ safes, currency, trusted: true, excludeSpam: true }, true).unwrap()

          if (overviews.length === 0) {
            return { isOwner: false }
          }

          return findOwner(overviews, address)
        }

        if (activeSafe) {
          const result = await singleSafeTrigger({
            safeAddress: activeSafe.address,
            chainId: activeSafe.chainId,
          }).unwrap()

          if (!result) {
            return { isOwner: false }
          }

          return findOwner([result], address)
        }

        return { isOwner: false }
      } catch (error) {
        logger.error('Error validating address ownership:', error)
        return { isOwner: false }
      }
    },
    [pendingSafe, activeSafe, chainIds, currency, overviewsTrigger, singleSafeTrigger],
  )

  return {
    validateAddressOwnership,
  }
}
