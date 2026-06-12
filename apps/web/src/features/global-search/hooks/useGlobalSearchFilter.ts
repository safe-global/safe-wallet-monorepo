import { useEffect, useId, useRef } from 'react'
import { useSectionVisibility } from '../components/SearchSection/SectionVisibilityContext'
import useSearchFilter from '@/hooks/useSearchFilter'

type FilterFn<T> = (item: T, query: string) => boolean

/**
 * Filters a list of items based on a search query.
 * Automatically reports whether there are results to the SectionVisibilityContext.
 *
 * @param items - The list to filter
 * @param query - The search string
 * @param filterBy - Either a key of T to match against, or a callback that returns
 *                   true to keep the item and false to remove it
 */
const useGlobalSearchFilter = <T>(items: T[], query: string, filterBy: keyof T | FilterFn<T>): T[] => {
  const { reportVisibility } = useSectionVisibility()
  const id = useId()
  const idRef = useRef(id)

  const filteredItems = useSearchFilter(items, query, filterBy)

  useEffect(() => {
    const currentId = idRef.current
    reportVisibility(currentId, filteredItems.length > 0)
    return () => reportVisibility(currentId, false)
  }, [reportVisibility, filteredItems.length])

  return filteredItems
}

export default useGlobalSearchFilter
