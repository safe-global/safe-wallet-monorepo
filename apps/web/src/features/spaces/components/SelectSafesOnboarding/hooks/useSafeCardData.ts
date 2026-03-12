import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useSafeItemData } from '@/features/myAccounts/hooks/useSafeItemData'
import { useMultiAccountItemData } from '@/features/myAccounts/hooks/useMultiAccountItemData'

const useSafeCardData = (safe: SafeItem | MultiChainSafeItem) => {
  const isMultiChain = isMultiChainSafeItem(safe)
  const singleData = useSafeItemData(isMultiChain ? (safe as MultiChainSafeItem).safes[0] : (safe as SafeItem))
  const multiData = useMultiAccountItemData(
    isMultiChain ? (safe as MultiChainSafeItem) : ({ address: '', safes: [] } as unknown as MultiChainSafeItem),
  )

  if (isMultiChain) {
    const { name, totalFiatValue, sharedSetup, deployedChainIds } = multiData
    return {
      name,
      fiatValue: totalFiatValue?.toString(),
      threshold: sharedSetup?.threshold ?? 0,
      ownersCount: sharedSetup?.owners.length ?? 0,
      chainIds: deployedChainIds,
      elementRef: undefined,
    }
  }

  const { name, threshold, owners, safeOverview, elementRef } = singleData
  return {
    name,
    fiatValue: safeOverview?.fiatTotal,
    threshold,
    ownersCount: owners.length,
    chainIds: [(safe as SafeItem).chainId],
    elementRef,
  }
}

export default useSafeCardData
