import { useState, useCallback, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { blo } from 'blo'
import { Copy, Check } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getInitials, getSafeDisplayInfo } from '../utils'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeBalanceBlock from './SafeBalanceBlock'
import type { SafeItemData } from '../types'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId }: SafeSelectorTriggerContentProps) {
  const [copied, setCopied] = useState(false)
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const chainShortName = selectedChain?.shortName ?? ''

  const resolvedName = useSafeDisplayName(selectedItem.address, selectedChainId)
  const { addressWithPrefix, displayName, showAddressLine } = getSafeDisplayInfo(
    resolvedName,
    selectedItem.address,
    chainShortName,
  )

  const runCopy = useCallback(() => {
    navigator.clipboard.writeText(selectedItem.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent(OVERVIEW_EVENTS.COPY_ADDRESS, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Copy Address' })
  }, [selectedItem.address])

  const handleCopyPointer = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    runCopy()
  }

  const handleCopyKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    runCopy()
  }

  const copyButton = (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            onClick={handleCopyPointer}
            onPointerDown={handleCopyPointer}
            onKeyDown={handleCopyKeyDown}
            className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer inline-flex"
            aria-label="Copy address"
            data-testid="copy-address-btn"
          />
        }
      >
        {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy address'}</TooltipContent>
    </Tooltip>
  )

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full">
      <Avatar size="sm" data-testid="safe-icon">
        <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0" data-testid="safe-selector-trigger-details">
        <div className="flex items-center gap-1">
          <Typography data-testid="safe-selector-trigger-name" variant="paragraph-small-medium" className="truncate">
            {displayName}
          </Typography>
          {!showAddressLine && copyButton}
          {!showAddressLine && <EnvHintButton chainId={selectedChainId} />}
        </div>
        {showAddressLine && (
          <div className="flex items-center gap-1">
            <Typography data-testid="safe-selector-trigger-address" variant="paragraph-mini" color="muted">
              {addressWithPrefix}
            </Typography>
            {copyButton}
            <EnvHintButton chainId={selectedChainId} />
          </div>
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
