import { isMultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import SafeCardReadOnly from '@/features/spaces/components/SafeAccounts/SafeCardReadOnly'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '@/features/global-search/hooks/useGlobalSearchFilter'
import useMatchSafe from '@/features/global-search/hooks/useMatchSafe'
import SectionWrapper from '../../SectionWrapper'

const AccountsSection = ({ query, label }: SectionItemProps) => {
  const { allSafes, isLoading } = useSpaceSafes()
  const matchSafe = useMatchSafe()

  const filteredSafes = useGlobalSearchFilter(allSafes, query, matchSafe)
  console.log('### accounts', allSafes, filteredSafes)

  if (isLoading) {
    return (
      <SectionWrapper label={label}>
        <div className="flex flex-col gap-2 px-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </SectionWrapper>
    )
  }

  if (filteredSafes.length === 0) {
    return null
  }

  return (
    <SectionWrapper label={label}>
      <div className="flex flex-col gap-1 px-4">
        {filteredSafes.map((safe, index) => {
          const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
          return (
            <SafeCardReadOnly
              key={key}
              safe={safe}
              hideContextMenu
              showPending={false}
              className="px-2 sm:px-2 -mx-2"
            />
          )
        })}
      </div>
    </SectionWrapper>
  )
}

export default AccountsSection
