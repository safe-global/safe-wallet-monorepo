import { Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '../utils'
import ChainSelectorBlock from './ChainSelectorBlock'
import SafeBalanceBlock from './SafeBalanceBlock'
import type { SafeItemData } from '../types'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
  hasMultipleChains: boolean
  onChainSelect: (chainId: string, event?: React.MouseEvent) => void
}

function SafeSelectorTriggerContent({
  selectedItem,
  selectedChainId,
  hasMultipleChains,
  onChainSelect,
}: SafeSelectorTriggerContentProps) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="flex items-center gap-4 w-full">
      <Avatar size="sm">
        <AvatarFallback>{getInitials(selectedItem.name || '?')}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{selectedItem.name}</span>
          <Settings className="size-3 text-muted-foreground shrink-0" />
        </div>
        <span className="text-xs text-muted-foreground">{selectedItem.address}</span>
      </div>
      <div
        className="shrink-0"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        role="group"
        aria-label={hasMultipleChains ? 'Chain selector' : undefined}
      >
        <ChainSelectorBlock
          hasMultipleChains={hasMultipleChains}
          chains={selectedItem.chains}
          selectedChainId={selectedChainId}
          onChainSelect={onChainSelect}
        />
      </div>
      <SafeBalanceBlock
        isLoading={selectedItem.isLoading ?? false}
        balance={selectedItem.balance}
        threshold={selectedItem.threshold}
        owners={selectedItem.owners}
        showBalanceDisplay={!hasMultipleChains}
      />
    </div>
  )
}

export default SafeSelectorTriggerContent
