import { useState, useMemo, useEffect } from 'react'
import type { SafeItemData } from '../types'

interface UseSafeSelectorStateProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  onChainChange?: (chainId: string) => void
}

export const useSafeSelectorState = ({
  items,
  selectedItemId,
  onItemSelect,
  onChainChange,
}: UseSafeSelectorStateProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0],
    [items, selectedItemId],
  )

  const isSingleSafe = items.length <= 1
  const hasMultipleChains = (selectedItem?.chains?.length ?? 0) > 1

  useEffect(() => {
    const chainId = selectedItem?.chains?.[0]?.chainId
    if (chainId) {
      setSelectedChainId(chainId)
    }
  }, [selectedItem])

  const handleOpenChange = (next: boolean) => {
    setDropdownOpen(isSingleSafe ? false : next)
  }

  const handleChainSelect = (chainId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setSelectedChainId(chainId)
    onChainChange?.(chainId)
  }

  const handleSafeChange = (value: string | null) => {
    if (value) {
      onItemSelect?.(value)
    }
  }

  return {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    hasMultipleChains,
    handleOpenChange,
    handleChainSelect,
    handleSafeChange,
  }
}
