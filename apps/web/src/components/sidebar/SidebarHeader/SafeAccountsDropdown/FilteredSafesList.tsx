import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'

import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import css from './styles.module.css'

type FilteredSafesListProps = {
  searchQuery: string
  onSelect?: () => void
}

const FilteredSafesList = ({ searchQuery, onSelect }: FilteredSafesListProps): ReactElement => {
  const { allSingleSafes, allMultiChainSafes } = useAllSafesGrouped()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  const allSafes = useMemo(() => {
    return allSingleSafes && allMultiChainSafes ? [...allSingleSafes, ...allMultiChainSafes] : []
  }, [allSingleSafes, allMultiChainSafes])

  const rawSearchResults = useSafesSearch(allSafes, searchQuery)

  const searchResults = useMemo(() => {
    const comparator = getComparator(orderBy)
    return [...rawSearchResults].sort(comparator)
  }, [rawSearchResults, orderBy])

  if (searchResults.length === 0) {
    return (
      <Box className={css.emptyState}>
        <Typography className={css.emptyStateTitle}>No Safes match your search</Typography>
        <Typography className={css.emptyStateMessage}>Try a different search term</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography className={css.searchResultsHeader}>Found {searchResults.length} result(s)</Typography>
      {searchResults.map((safeItem) => {
        if (isMultiChainSafeItem(safeItem)) {
          return <MultiAccountItem key={safeItem.address} multiSafeAccountItem={safeItem} onLinkClick={onSelect} />
        }
        return (
          <SingleAccountItem
            key={`${safeItem.chainId}:${safeItem.address}`}
            safeItem={safeItem}
            onLinkClick={onSelect}
          />
        )
      })}
    </Box>
  )
}

export default FilteredSafesList
