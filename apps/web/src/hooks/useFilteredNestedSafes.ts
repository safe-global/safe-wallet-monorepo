import { useState, useEffect, useMemo, useCallback } from 'react'
import useSafeInfo from './useSafeInfo'
import { useTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getCreationTransaction } from '@/utils/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const MAX_NESTED_SAFES_TO_CHECK = 10

export type NestedSafeValidation = {
  address: string
  isValid: boolean
}

type UseFilteredNestedSafesResult = {
  validatedSafes: NestedSafeValidation[]
  isLoading: boolean
  startFiltering: () => void
  hasStarted: boolean
}

/**
 * Validates nested Safes and marks them as valid or invalid based on deployer:
 * - Valid: Deployed by one of the parent Safe's owners, the parent Safe itself, or the parent Safe's deployer
 * - Invalid: Deployed by anyone else (potential security risk)
 *
 * Call `startFiltering()` to begin the validation process (lazy loading).
 * Limited to checking MAX_NESTED_SAFES_TO_CHECK (10) nested Safes to avoid excessive API calls.
 */
export function useFilteredNestedSafes(rawNestedSafes: string[], chainId: string): UseFilteredNestedSafesResult {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const [validatedSafes, setValidatedSafes] = useState<NestedSafeValidation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Fetch parent Safe's creation transaction to get its deployer
  const { data: parentCreation, isLoading: isParentCreationLoading } = useTransactionsGetCreationTransactionV1Query(
    { chainId, safeAddress },
    { skip: !chainId || !safeAddress || !safeLoaded || !hasStarted },
  )

  // Build the set of allowed deployers
  const allowedDeployers = useMemo(() => {
    const deployers = new Set<string>()

    // Add parent Safe's owners
    safe.owners.forEach((owner) => {
      deployers.add(owner.value.toLowerCase())
    })

    // Add parent Safe address itself
    if (safeAddress) {
      deployers.add(safeAddress.toLowerCase())
    }

    // Add parent Safe's deployer
    if (parentCreation?.creator) {
      deployers.add(parentCreation.creator.toLowerCase())
    }

    return deployers
  }, [safe.owners, safeAddress, parentCreation?.creator])

  const startFiltering = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true)
      setIsLoading(true)
    }
  }, [hasStarted])

  useEffect(() => {
    const validateNestedSafes = async () => {
      if (!hasStarted || !chainId || !safeLoaded || isParentCreationLoading) {
        return
      }

      if (rawNestedSafes.length === 0) {
        setValidatedSafes([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Limit to MAX_NESTED_SAFES_TO_CHECK to avoid excessive API calls
        const safesToCheck = rawNestedSafes.slice(0, MAX_NESTED_SAFES_TO_CHECK)

        // Fetch creation transactions for nested Safes
        const creationResults = await Promise.all(
          safesToCheck.map(async (nestedSafeAddress) => {
            try {
              const creation = await getCreationTransaction(chainId, nestedSafeAddress)
              return { address: nestedSafeAddress, creator: creation.creator }
            } catch {
              // If we can't fetch creation data, mark as invalid
              return { address: nestedSafeAddress, creator: null }
            }
          }),
        )

        // Validate each Safe and mark as valid/invalid
        const validated: NestedSafeValidation[] = creationResults.map(({ address, creator }) => {
          const isValid = creator
            ? Array.from(allowedDeployers).some((allowed) => sameAddress(creator, allowed))
            : false
          return { address, isValid }
        })

        // Add remaining safes beyond the limit as invalid (not checked)
        const uncheckedSafes = rawNestedSafes.slice(MAX_NESTED_SAFES_TO_CHECK).map((address) => ({
          address,
          isValid: false,
        }))

        setValidatedSafes([...validated, ...uncheckedSafes])
      } catch {
        // On error, mark all as invalid for safety
        setValidatedSafes(rawNestedSafes.map((address) => ({ address, isValid: false })))
      } finally {
        setIsLoading(false)
      }
    }

    validateNestedSafes()
  }, [rawNestedSafes, chainId, safeLoaded, isParentCreationLoading, allowedDeployers, hasStarted])

  return { validatedSafes, isLoading, startFiltering, hasStarted }
}
