import { useState, useMemo, useEffect, useCallback } from 'react'
import type { SafeItemData } from '../types'

interface UseSafeSelectorStateProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  /** When true, the dropdown can open even with a single safe (e.g. header/footer present). */
  forceOpenable?: boolean
}

// No items[0] fallback on miss — surfaces regressions instead of silently
// snapping to the wrong safe.
const getSelectedItem = (items: SafeItemData[], selectedItemId?: string) => {
  if (!selectedItemId) return undefined
  return items.find((item) => item.id === selectedItemId)
}

const getFirstChainId = (item: SafeItemData | undefined) => {
  return item?.chains?.[0]?.chainId ?? ''
}

export const useSafeSelectorState = ({
  items,
  selectedItemId,
  onItemSelect,
  forceOpenable,
}: UseSafeSelectorStateProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  const selectedItem = useMemo(() => getSelectedItem(items, selectedItemId), [items, selectedItemId])
  const isSingleSafe = items.length <= 1 && !forceOpenable

  useEffect(() => {
    const chainId = getFirstChainId(selectedItem)
    setSelectedChainId(chainId)
  }, [selectedItem])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setDropdownOpen(isSingleSafe ? false : next)
    },
    [isSingleSafe],
  )

  const handleSafeChange = useCallback(
    (value: string | null) => {
      const itemId = value ?? ''
      // Skip reselecting the previous id before the URL updates
      const currentSelectionId = selectedItemId ?? selectedItem?.id ?? ''
      if (itemId === currentSelectionId) return
      onItemSelect?.(itemId)
    },
    [onItemSelect, selectedItemId, selectedItem],
  )

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false)
  }, [])

  return {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    handleOpenChange,
    handleSafeChange,
    closeDropdown,
  }
}
