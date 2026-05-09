import { useMemo, useState } from 'react'
import { useParentSafeThreshold } from './useParentSafeThreshold'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

export const buildDelegatorOptions = (
  isEditing: boolean,
  isDirectOwner: boolean,
  walletAddress: string | undefined,
  nestedSafeOwners: string[] | null | undefined,
): string[] => {
  if (isEditing) return []
  const options: string[] = []
  if (isDirectOwner && walletAddress) options.push(walletAddress)
  if (nestedSafeOwners) options.push(...nestedSafeOwners)
  return options
}

export const resolveEffectiveDelegator = (
  isEditing: boolean,
  proposerDelegator: string | undefined,
  selectedDelegator: string | undefined,
  defaultOption: string | undefined,
): string | undefined => {
  if (isEditing) return proposerDelegator
  return selectedDelegator ?? defaultOption
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

export const checkCanEdit = (
  walletAddress: string | undefined,
  proposerDelegator: string | undefined,
  nestedSafeOwners: string[] | null | undefined,
): boolean =>
  sameAddress(walletAddress, proposerDelegator) ||
  (nestedSafeOwners?.some((addr) => sameAddress(addr, proposerDelegator)) ?? false)

/**
 * Encapsulates all delegator selection logic for the proposer add/edit flow.
 * Determines the effective delegator address, whether a nested Safe is involved,
 * and whether multi-sig signing is required.
 */
export const useDelegatorSelection = (proposer: Delegate | undefined) => {
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const nestedSafeOwners = useNestedSafeOwners()
  const isEditing = !!proposer
  const isDirectOwner = isWalletDirectOwner(safe.owners, wallet?.address)

  const delegatorOptions = useMemo(
    () => buildDelegatorOptions(isEditing, isDirectOwner, wallet?.address, nestedSafeOwners),
    [isEditing, isDirectOwner, wallet?.address, nestedSafeOwners],
  )

  const [selectedDelegator, setSelectedDelegator] = useState<string | undefined>(undefined)

  const effectiveDelegator = useMemo(
    () => resolveEffectiveDelegator(isEditing, proposer?.delegator, selectedDelegator, delegatorOptions[0]),
    [isEditing, proposer?.delegator, selectedDelegator, delegatorOptions],
  )

  const parentSafeAddress = resolveParentSafeAddress(nestedSafeOwners, effectiveDelegator)
  const {
    threshold: parentThreshold,
    owners: parentOwners,
    isLoading: isParentLoading,
  } = useParentSafeThreshold(parentSafeAddress)
  const isMultiSigRequired = checkMultiSigRequired(parentSafeAddress, parentThreshold)
  const canEdit = checkCanEdit(wallet?.address, proposer?.delegator, nestedSafeOwners)

  return {
    delegatorOptions,
    setSelectedDelegator,
    effectiveDelegator,
    parentSafeAddress,
    parentThreshold,
    parentOwners,
    isMultiSigRequired,
    isParentLoading,
    canEdit,
  }
}
