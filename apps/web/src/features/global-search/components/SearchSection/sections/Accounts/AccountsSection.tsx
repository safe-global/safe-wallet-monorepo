import { isMultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import { SafeCardReadOnly } from '@/features/spaces'
import { Skeleton } from '@/components/ui/skeleton'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '../../../../hooks/useGlobalSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import SectionWrapper from '../../SectionWrapper'

const AccountsSection = ({ query, label }: SectionItemProps) => {
  const { allSafes, isLoading } = useSpaceSafes()
  const matchSafe = useMatchSafe()

  const filteredSafes = useGlobalSearchFilter(allSafes, query, matchSafe)

  if (isLoading) {
    return (
      <SectionWrapper label={label}>
        <div className="flex flex-col gap-2 px-2">
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
      <div className="flex flex-col gap-1 px-2">
        {filteredSafes.map((safe, index) => {
          const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
          return (
            <div key={key} data-search-item className="group/search-focus">
              <SafeCardReadOnly
                safe={safe}
                hideContextMenu
                showPending={false}
                className="group-data-[focused]/search-focus:bg-accent px-2 sm:px-2"
              />
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

export default AccountsSection
