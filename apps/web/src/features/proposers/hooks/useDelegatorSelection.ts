import { useMemo, useState } from 'react'
import { useParentSafeThreshold } from './useParentSafeThreshold'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

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

  const isDirectOwner = safe.owners.some((owner) => sameAddress(owner.value, wallet?.address))

  const delegatorOptions = useMemo(() => {
    if (isEditing) return []
    const options: string[] = []
    if (isDirectOwner && wallet?.address) options.push(wallet.address)
    if (nestedSafeOwners) options.push(...nestedSafeOwners)
    return options
  }, [isEditing, isDirectOwner, wallet?.address, nestedSafeOwners])

  const [selectedDelegator, setSelectedDelegator] = useState<string | undefined>(undefined)

  const effectiveDelegator = useMemo(() => {
    if (isEditing) return proposer?.delegator
    return selectedDelegator ?? delegatorOptions[0]
  }, [isEditing, proposer?.delegator, selectedDelegator, delegatorOptions])

  const isNestedDelegator = nestedSafeOwners?.some((addr) => sameAddress(addr, effectiveDelegator)) ?? false
  const parentSafeAddress = isNestedDelegator ? effectiveDelegator : undefined

  const { threshold: parentThreshold, owners: parentOwners } = useParentSafeThreshold(parentSafeAddress)

  const isMultiSigRequired = isNestedDelegator && parentThreshold !== undefined && parentThreshold > 1

  const canEdit =
    sameAddress(wallet?.address, proposer?.delegator) ||
    (nestedSafeOwners?.some((addr) => sameAddress(addr, proposer?.delegator)) ?? false)

  return {
    delegatorOptions,
    setSelectedDelegator,
    effectiveDelegator,
    parentSafeAddress,
    parentThreshold,
    parentOwners,
    isMultiSigRequired,
    canEdit,
  }
}
