import { blo } from 'blo'
import { Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { getInitials, getSafeDisplayInfo } from '../utils'
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
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const chainShortName = selectedChain?.shortName ?? ''
  const { addressWithPrefix, displayName, showAddressLine } = getSafeDisplayInfo(
    selectedItem.name,
    selectedItem.address,
    chainShortName,
  )

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full">
      <Avatar size="sm">
        <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Typography variant="paragraph-small-medium" className="truncate">
            {displayName}
          </Typography>
          <Settings className="size-3 text-muted-foreground shrink-0" />
        </div>
        {showAddressLine && (
          <Typography variant="paragraph-mini" color="muted">
            {addressWithPrefix}
          </Typography>
        )}
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
