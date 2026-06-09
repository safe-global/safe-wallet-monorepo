import { blo } from 'blo'
import { AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getInitials, getSafeDisplayInfo } from '../utils'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeBalanceBlock from './SafeBalanceBlock'
import ThresholdBadge from './ThresholdBadge'
import CopyAddressButton from './CopyAddressButton'
import type { SafeItemData } from '../types'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId }: SafeSelectorTriggerContentProps) {
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const isUndeployed = Boolean(selectedChain?.isUndeployed)
  const isActivating = Boolean(selectedChain?.isActivating)

  const resolvedName = useSafeDisplayName(selectedItem.address, selectedChainId)
  const { shortAddress, displayName } = getSafeDisplayInfo(resolvedName, selectedItem.address)

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full">
      <div className="relative shrink-0">
        <Avatar size="sm" data-testid="safe-icon">
          <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
        </Avatar>
        <ThresholdBadge threshold={selectedItem.threshold} owners={selectedItem.owners} />
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0" data-testid="safe-selector-trigger-details">
        <Typography data-testid="safe-selector-trigger-name" variant="paragraph-small-medium" className="truncate">
          {displayName}
        </Typography>
        <div className="flex items-center gap-1 min-w-0">
          <Typography data-testid="safe-selector-trigger-address" variant="paragraph-mini" color="muted">
            {shortAddress}
          </Typography>
          <CopyAddressButton address={selectedItem.address} />
          <EnvHintButton chainId={selectedChainId} />
        </div>
      </div>
      {isUndeployed ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                tabIndex={0}
                className="flex shrink-0 items-center"
                data-testid="safe-selector-not-activated-icon"
                aria-label={isActivating ? 'Activating' : 'Not activated'}
              />
            }
          >
            <AlertCircle
              className="size-4"
              style={{ color: isActivating ? 'var(--color-info-dark)' : 'var(--color-warning-main)' }}
            />
          </TooltipTrigger>
          <TooltipContent>{isActivating ? 'Activating' : 'Not activated'}</TooltipContent>
        </Tooltip>
      ) : (
        <SafeBalanceBlock
          isLoading={selectedItem.isLoading ?? false}
          balance={selectedItem.balance}
          threshold={selectedItem.threshold}
          owners={selectedItem.owners}
          showBalanceDisplay={false}
        />
      )}
    </div>
  )
}

export default SafeSelectorTriggerContent
