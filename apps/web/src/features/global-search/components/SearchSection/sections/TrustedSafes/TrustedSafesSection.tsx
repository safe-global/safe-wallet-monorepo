import { useMemo } from 'react'
import { isMultiChainSafeItem, useOwnedSafesGrouped, flattenSafeItems } from '@/hooks/safes'
import SafeCardReadOnly from '@/features/spaces/components/SafeAccounts/SafeCardReadOnly'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '@/features/global-search/hooks/useGlobalSearchFilter'
import useMatchSafe from '@/features/global-search/hooks/useMatchSafe'
import SectionWrapper from '../../SectionWrapper'

const TrustedSafesSection = ({ query, label }: SectionItemProps) => {
  const { allMultiChainSafes, allSingleSafes } = useOwnedSafesGrouped()
  const allSafes = useMemo(
    () => flattenSafeItems([...(allMultiChainSafes ?? []), ...(allSingleSafes ?? [])]),
    [allMultiChainSafes, allSingleSafes],
  )
  const matchSafe = useMatchSafe()

  const filteredSafes = useGlobalSearchFilter(allSafes, query, matchSafe)

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
              className="px-0 sm:px-0 hover:bg-card"
            />
          )
        })}
      </div>
    </SectionWrapper>
  )
}

export default TrustedSafesSection
