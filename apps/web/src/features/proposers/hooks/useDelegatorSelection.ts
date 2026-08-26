import { useMemo, useState } from 'react'
import { useParentSafeThreshold } from './useParentSafeThreshold'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const buildDelegatorOptions = (
  isDirectOwner: boolean,
  walletAddress: string | undefined,
  nestedSafeOwners: string[] | null | undefined,
): string[] => {
  const options: string[] = []
  if (isDirectOwner && walletAddress) options.push(walletAddress)
  if (nestedSafeOwners) options.push(...nestedSafeOwners)
  return options
}

export const resolveParentSafeAddress = (
  nestedSafeOwners: string[] | null | undefined,
  effectiveDelegator: string | undefined,
): string | undefined => {
  const isNested = nestedSafeOwners?.some((addr) => sameAddress(addr, effectiveDelegator)) ?? false
  return isNested ? effectiveDelegator : undefined
}

export const isWalletDirectOwner = (owners: Array<{ value: string }>, walletAddress: string | undefined): boolean =>
  owners.some((owner) => sameAddress(owner.value, walletAddress))

export const checkMultiSigRequired = (
  parentSafeAddress: string | undefined,
  parentThreshold: number | undefined,
): boolean => !!parentSafeAddress && parentThreshold !== undefined && parentThreshold > 1

/**
 * Encapsulates all delegator selection logic for adding a proposer.
 * Determines the effective delegator address, whether a nested Safe is involved,
 * and whether multi-sig signing is required.
 */
export const useDelegatorSelection = () => {
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const nestedSafeOwners = useNestedSafeOwners()
  const isDirectOwner = isWalletDirectOwner(safe.owners, wallet?.address)

  const delegatorOptions = useMemo(
    () => buildDelegatorOptions(isDirectOwner, wallet?.address, nestedSafeOwners),
    [isDirectOwner, wallet?.address, nestedSafeOwners],
  )

  const [selectedDelegator, setSelectedDelegator] = useState<string | undefined>(undefined)

  // `.at(0)` rather than `[0]`: delegatorOptions is empty when the wallet owns neither this Safe
  // nor a parent, and only `.at` types that absence honestly
  const effectiveDelegator = selectedDelegator ?? delegatorOptions.at(0)

  const parentSafeAddress = resolveParentSafeAddress(nestedSafeOwners, effectiveDelegator)
  const {
    threshold: parentThreshold,
    owners: parentOwners,
    isLoading: isParentLoading,
  } = useParentSafeThreshold(parentSafeAddress)
  const isMultiSigRequired = checkMultiSigRequired(parentSafeAddress, parentThreshold)

  return {
    delegatorOptions,
    setSelectedDelegator,
    effectiveDelegator,
    parentSafeAddress,
    parentThreshold,
    parentOwners,
    isMultiSigRequired,
    isParentLoading,
  }
}
