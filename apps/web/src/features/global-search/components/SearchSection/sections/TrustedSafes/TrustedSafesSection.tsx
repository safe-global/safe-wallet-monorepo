import { useMemo } from 'react'
import { isMultiChainSafeItem, useAllSafesGrouped, flattenSafeItems } from '@/hooks/safes'
import { SafeCardReadOnly } from '@/features/spaces'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '../../../../hooks/useGlobalSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import SectionWrapper from '../../SectionWrapper'

const TrustedSafesSection = ({ query, label }: SectionItemProps) => {
  const { allMultiChainSafes, allSingleSafes } = useAllSafesGrouped()
  const pinnedSafes = useMemo(
    () =>
      flattenSafeItems([
        ...(allMultiChainSafes?.filter((safe) => safe.isPinned) ?? []),
        ...(allSingleSafes?.filter((safe) => safe.isPinned) ?? []),
      ]),
    [allMultiChainSafes, allSingleSafes],
  )
  const matchSafe = useMatchSafe()
  const filteredSafes = useGlobalSearchFilter(pinnedSafes, query, matchSafe)

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
                className="group-data-[focused]/search-focus:bg-muted/50 px-2 sm:px-2"
              />
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

export default TrustedSafesSection
