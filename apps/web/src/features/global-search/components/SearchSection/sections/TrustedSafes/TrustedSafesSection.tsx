import { useMemo } from 'react'
import { isMultiChainSafeItem, useAllSafesGrouped, flattenSafeItems } from '@/hooks/safes'
import { SafeCardReadOnly } from '@/features/spaces'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '../../../../hooks/useGlobalSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import { TrustedSafesSectionView } from '@views/features/global-search/components/SearchSection/sections/TrustedSafes/TrustedSafesSectionView'

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

  return (
    <TrustedSafesSectionView
      label={label}
      items={filteredSafes.map((safe, index) => ({
        key: isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`,
        safe,
      }))}
      renderSafeCard={(props) => <SafeCardReadOnly {...props} hideContextMenu showPending={false} />}
    />
  )
}

export default TrustedSafesSection
