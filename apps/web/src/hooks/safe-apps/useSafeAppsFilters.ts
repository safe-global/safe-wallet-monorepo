import useCategoryFilter from '@/hooks/safe-apps/useCategoryFilter'
import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { useAppsFilterByCategory } from './useAppsFilterByCategory'
import { useAppsSearch } from './useAppsSearch'
import { useAppsFilterByOptimizedForBatch } from './useAppsFilterByOptimizedForBatch'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'

type ReturnType = {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  optimizedWithBatchFilter: boolean
  setOptimizedWithBatchFilter: Dispatch<SetStateAction<boolean>>
  filteredApps: SafeAppData[]
}

const useSafeAppsFilters = (safeAppsList: SafeAppData[]): ReturnType => {
  const [query, setQuery] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [optimizedWithBatchFilter, setOptimizedWithBatchFilter] = useState<boolean>(false)

  const filteredAppsByQuery = useAppsSearch(safeAppsList, query)
  const filteredAppsByQueryAndCategories = useAppsFilterByCategory(filteredAppsByQuery, selectedCategories)
  const filteredApps = useAppsFilterByOptimizedForBatch(filteredAppsByQueryAndCategories, optimizedWithBatchFilter)

  const { onSelectCategories } = useCategoryFilter({
    safeAppsList,
    selectedCategories,
    setSelectedCategories,
  })

  const debouncedSearchQuery = useDebounce(query, 2000)
  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.SEARCH, label: debouncedSearchQuery })
    }
  }, [debouncedSearchQuery])

  return {
    query,
    setQuery,

    selectedCategories,
    setSelectedCategories: onSelectCategories,

    optimizedWithBatchFilter,
    setOptimizedWithBatchFilter,

    filteredApps,
  }
}

export default useSafeAppsFilters
