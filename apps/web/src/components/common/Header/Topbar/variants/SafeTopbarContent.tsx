import type { ReactElement } from 'react'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { useTopbarSafeData } from '../hooks/useTopbarSafeData'

export const SafeTopbarContent = (): ReactElement | null => {
  const { items, selectedItemId, handleItemSelect, handleChainChange } = useTopbarSafeData()

  if (items.length === 0) {
    return null
  }

  return (
    <SafeSelectorDropdown
      items={items}
      selectedItemId={selectedItemId}
      onItemSelect={handleItemSelect}
      onChainChange={handleChainChange}
    />
  )
}
