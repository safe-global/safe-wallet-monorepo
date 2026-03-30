import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { getInitials, getSafeDisplayInfo } from '../utils'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeBalanceBlock from './SafeBalanceBlock'
import type { SafeItemData } from '../types'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId }: SafeSelectorTriggerContentProps) {
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const chainShortName = selectedChain?.shortName ?? ''

  const resolvedName = useSafeDisplayName(selectedItem.address, selectedChainId, selectedItem.name)
  const { addressWithPrefix, displayName, showAddressLine } = getSafeDisplayInfo(
    resolvedName,
    selectedItem.address,
    chainShortName,
  )
  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full">
      <Avatar size="sm" data-testid="safe-selector-trigger-identicon">
        <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0" data-testid="safe-selector-trigger-details">
        <div className="flex items-center gap-1.5">
          <Typography data-testid="safe-selector-trigger-name" variant="paragraph-small-medium" className="truncate">
            {displayName}
          </Typography>
        </div>
        {showAddressLine && (
          <Typography data-testid="safe-selector-trigger-address" variant="paragraph-mini" color="muted">
            {addressWithPrefix}
          </Typography>
        )}
      </div>
      <SafeBalanceBlock
        isLoading={selectedItem.isLoading ?? false}
        balance={selectedItem.balance}
        threshold={selectedItem.threshold}
        owners={selectedItem.owners}
        showBalanceDisplay
      />
    </div>
  )
}

export default SafeSelectorTriggerContent
