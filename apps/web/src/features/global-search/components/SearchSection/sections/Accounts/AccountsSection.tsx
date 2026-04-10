import { useCallback } from 'react'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import SafeCardReadOnly from '@/features/spaces/components/SafeAccounts/SafeCardReadOnly'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '@/features/global-search/hooks/useGlobalSearchFilter'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'

const AccountsSection = ({ query }: SectionItemProps) => {
  const { allSafes, isLoading } = useSpaceSafes()
  const addressBooks = useAppSelector(selectAllAddressBooks)

  const matchSafe = useCallback(
    (safe: AllSafeItems[number], q: string): boolean => {
      const address = safe.address.toLowerCase()
      const safeName =
        safe.name ?? addressBooks[isMultiChainSafeItem(safe) ? safe.safes[0].chainId : safe.chainId]?.[safe.address]
      return address.includes(q) || (safeName?.toLowerCase().includes(q) ?? false)
    },
    [addressBooks],
  )

  const filteredSafes = useGlobalSearchFilter(allSafes, query, matchSafe)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (filteredSafes.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 px-4">
      {filteredSafes.map((safe, index) => {
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
