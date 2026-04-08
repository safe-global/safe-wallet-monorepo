import { isMultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import SafeCardReadOnly from '@/features/spaces/components/SafeAccounts/SafeCardReadOnly'
import { Skeleton } from '@/components/ui/skeleton'

const AccountsSection = () => {
  const { allSafes, isLoading } = useSpaceSafes()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

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

export default AccountsSection
