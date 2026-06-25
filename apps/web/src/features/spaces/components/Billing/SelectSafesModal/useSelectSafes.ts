import { useEffect, useState } from 'react'
import { useSpaceSafes } from '@/features/spaces'
import { useSafesSearch } from '@/hooks/safes/useSafesSearch'

const toKey = (address: string) => address.toLowerCase()

export const useSelectSafes = (open: boolean, initialSelected: string[]) => {
  const { allSafes, isLoading } = useSpaceSafes()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const initialKey = initialSelected.map(toKey).sort().join(',')
  useEffect(() => {
    if (open) {
      setSelected(new Set(initialKey ? initialKey.split(',') : []))
      setQuery('')
    }
  }, [open, initialKey])

  const searchResults = useSafesSearch(allSafes, query)
  const displayed = query ? searchResults : allSafes

  const isSelected = (address: string) => selected.has(toKey(address))

  const toggle = (address: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      const key = toKey(address)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const selectedDisplayedCount = displayed.filter((safe) => isSelected(safe.address)).length
  const allSelected = displayed.length > 0 && selectedDisplayedCount === displayed.length
  const someSelected = selectedDisplayedCount > 0 && !allSelected

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      displayed.forEach((safe) => (allSelected ? next.delete(toKey(safe.address)) : next.add(toKey(safe.address))))
      return next
    })

  return {
    isLoading,
    query,
    setQuery,
    displayed,
    isSelected,
    toggle,
    allSelected,
    someSelected,
    toggleAll,
    selectedAddresses: () => [...selected],
  }
}
