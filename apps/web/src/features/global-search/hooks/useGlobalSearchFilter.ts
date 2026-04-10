import { useMemo } from 'react'

type FilterFn<T> = (item: T, query: string) => boolean

/**
 * Filters a list of items based on a search query.
 *
 * @param items - The list to filter
 * @param query - The search string
 * @param filterBy - Either a key of T to match against, or a callback that returns
 *                   true to keep the item and false to remove it
 */
const useGlobalSearchFilter = <T>(items: T[], query: string, filterBy: keyof T | FilterFn<T>): T[] => {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return items

    const matchFn: FilterFn<T> =
      typeof filterBy === 'function' ? filterBy : (item) => String(item[filterBy]).toLowerCase().includes(trimmed)
    const filteredItems = items.filter((item) => matchFn(item, trimmed))
    console.log(filteredItems)
    return filteredItems
  }, [items, query, filterBy])
}

export default useGlobalSearchFilter
