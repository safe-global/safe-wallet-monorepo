import { useState, useMemo, useEffect } from 'react'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import type { SafeSelectorDropdownProps } from './types'

function SafeSelectorDropdown({ items, selectedItemId, onItemSelect, onChainChange }: SafeSelectorDropdownProps) {
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

  if (!selectedItem) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        !isSingleSafe && 'cursor-pointer',
      )}
    >
      <Select
        value={selectedItemId ?? selectedItem.id}
        onValueChange={handleSafeChange}
        open={isSingleSafe ? false : dropdownOpen}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent py-0 pl-6 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0',
            !isSingleSafe && 'cursor-pointer',
            isSingleSafe && 'pr-10',
          )}
          size="default"
          iconWrapperClassName={cn(
            !isSingleSafe && 'border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]',
            isSingleSafe && 'hidden',
          )}
        >
          <SelectValue>
            <SafeSelectorTriggerContent
              selectedItem={selectedItem}
              selectedChainId={selectedChainId}
              hasMultipleChains={hasMultipleChains}
              onChainSelect={handleChainSelect}
            />
          </SelectValue>
        </SelectTrigger>
        <SafeDropdownContainer
          items={items}
          selectedItemId={selectedItemId ?? selectedItem.id}
          onItemSelect={onItemSelect ?? (() => {})}
        />
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
