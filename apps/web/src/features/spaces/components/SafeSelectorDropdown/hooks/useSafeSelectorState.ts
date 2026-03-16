import { useState, useMemo, useEffect, useCallback } from 'react'
import type { SafeItemData } from '../types'

interface UseSafeSelectorStateProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
}

const getSelectedItem = (items: SafeItemData[], selectedItemId?: string) => {
  return items.find((item) => item.id === selectedItemId) ?? items[0]
}

const getFirstChainId = (item: SafeItemData | undefined) => {
  return item?.chains?.[0]?.chainId ?? ''
}

const hasMultipleChains = (item: SafeItemData | undefined) => {
  return (item?.chains?.length ?? 0) > 1
}

export const useSafeSelectorState = ({ items, selectedItemId, onItemSelect }: UseSafeSelectorStateProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  const selectedItem = useMemo(() => getSelectedItem(items, selectedItemId), [items, selectedItemId])
  const isSingleSafe = items.length <= 1
  const hasChains = hasMultipleChains(selectedItem)

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
      onItemSelect?.(itemId)
    },
    [onItemSelect],
  )

  return {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    handleOpenChange,
    handleSafeChange,
  }
}
