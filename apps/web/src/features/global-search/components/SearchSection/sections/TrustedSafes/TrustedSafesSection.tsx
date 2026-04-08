import { isMultiChainSafeItem, useOwnedSafesGrouped, flattenSafeItems } from '@/hooks/safes'
import SafeCardReadOnly from '@/features/spaces/components/SafeAccounts/SafeCardReadOnly'

const TrustedSafesSection = () => {
  const { allMultiChainSafes, allSingleSafes } = useOwnedSafesGrouped()
  const allSafes = flattenSafeItems([...(allMultiChainSafes ?? []), ...(allSingleSafes ?? [])])

  if (allSafes.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 px-4">
      {allSafes.map((safe, index) => {
        const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
        return (
          <SafeCardReadOnly
            key={key}
            safe={safe}
            hideContextMenu
            showPending={false}
            className="px-0 sm:px-0 hover:bg-card"
          />
        )
      })}
    </div>
  )
}

export default TrustedSafesSection
